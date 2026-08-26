#!/usr/bin/env python3
"""Minimal Kwai-style agent call against Ello5 when kagentsys CLI is unavailable."""
from __future__ import annotations

import json
import os
import sys
import urllib.request

HOST = os.environ.get("ELLOFIVE_HOST", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("ELLO5_AGENT_MODEL", "ellofive-fast")


def chat(messages: list[dict]) -> str:
    req = urllib.request.Request(
        f"{HOST}/v1/chat/completions",
        data=json.dumps(
            {"model": MODEL, "messages": messages, "temperature": 0.2, "stream": False}
        ).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as res:
        data = json.loads(res.read().decode())
    return data["choices"][0]["message"]["content"].strip()


def main() -> int:
    query = " ".join(sys.argv[1:]).strip()
    if not query:
        print('Usage: run_ello5.py "query"', file=sys.stderr)
        return 1
    plan = chat(
        [
            {
                "role": "system",
                "content": "You are KAgentSys-lite on Ello5. Plan 2-3 steps then answer. Be concise.",
            },
            {"role": "user", "content": query},
        ]
    )
    print(plan)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
