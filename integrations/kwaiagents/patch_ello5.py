#!/usr/bin/env python3
"""Patch KwaiAgents FastChatClient to talk to Ollama/Ello5 chat completions."""
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
CLIENT = ROOT / "vendor" / "KwaiAgents" / "kwaiagents" / "llms" / "clients.py"

PATCH_MARKER = "ELLO5_OLLAMA_CHAT_PATCH"

NEW_CHAT = '''
    def chat(self, query, history=list(), system="", temperature=0.0, stop="", *args, **kwargs):
        # ELLO5_OLLAMA_CHAT_PATCH — prefer Ollama OpenAI chat API
        url = f"http://{self.host}:{self.port}/v1/chat/completions"
        headers = {"Content-Type": "application/json"}
        msgs = make_gpt_messages(query, system, history)
        data = {
            "model": self.model,
            "messages": msgs,
            "temperature": temperature or 0.2,
            "stream": False,
        }
        try:
            resp = requests.post(url=url, json=data, headers=headers, timeout=180)
            response = resp.json()
            response_text = response["choices"][0]["message"]["content"]
        except Exception:
            # Fallback to legacy completions endpoint
            url2 = f"http://{self.host}:{self.port}/v1/completions"
            prompt = self.make_prompt(query, system, history)
            data2 = {
                "model": self.model,
                "prompt": prompt,
                "temperature": 0.1,
                "max_tokens": 512,
            }
            resp = requests.post(url=url2, json=data2, headers=headers, timeout=180)
            response = resp.json()
            response_text = response["choices"][0].get("text") or response["choices"][0].get("message", {}).get("content", "")
        new_history = history[:] + [[query, response_text]]
        return response_text, new_history
'''


def main() -> int:
    if not CLIENT.exists():
        print(f"KwaiAgents client not found: {CLIENT}", file=sys.stderr)
        return 1
    text = CLIENT.read_text()
    if PATCH_MARKER in text:
        print("KwaiAgents already patched for Ello5")
        return 0
    # Replace FastChatClient.chat method body by rewriting the class method
    start = text.find("class FastChatClient")
    if start < 0:
        print("FastChatClient not found", file=sys.stderr)
        return 1
    method = text.find("    def chat(self, query, history=list()", start)
    if method < 0:
        print("chat method not found", file=sys.stderr)
        return 1
    next_def = text.find("\n    @staticmethod\n    def make_prompt", method)
    if next_def < 0:
        print("make_prompt marker not found", file=sys.stderr)
        return 1
    patched = text[:method] + NEW_CHAT.rstrip() + "\n" + text[next_def:]
    CLIENT.write_text(patched)
    print(f"Patched {CLIENT} for Ello5/Ollama chat completions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
