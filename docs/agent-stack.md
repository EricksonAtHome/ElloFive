# Ello5 Agent Stack

Connect open-source agent frameworks to the local **Ello5** model (Ollama).

## What to use

| Project | Fit for Ello5 | What we do |
| --- | --- | --- |
| [KwaiAgents](https://github.com/KwaiKEG/KwaiAgents) | **Best agent loop** — local LLM via OpenAI-compatible API | Install + patch → `ellofive agents kwai` |
| [big-AGI](https://github.com/enricoros/big-AGI) | **Best multi-model UI** — native Ollama vendor | `OLLAMA_API_HOST` → `ellofive agents bigagi` |
| [AgentGPT](https://github.com/reworkd/AgentGPT) | Goal→tasks UI; needs Docker + MySQL | Clone docs; point `OPENAI_API_BASE` at Ollama `/v1` when Docker available |
| [SuperAGI](https://github.com/TransformerOptimus/SuperAGI) | Tooling agents; Docker-heavy | Same — use Ello5 as OpenAI-compatible backend |
| [microsoft/LMOps](https://github.com/microsoft/LMOps) | Research (prompts, acceleration) | Ideas only — no runtime install |

## Quick start

```bash
# Runtime must be up (models: ellofive, ellofive-fast)
ollama serve   # or: ellofive serve

ellofive agents install
ellofive agents status

# Native Ello5 agent (AgentGPT-style plan → execute → conclude)
ellofive agents run "Write a 3-step plan to secure a FastAPI health endpoint"

# KwaiAgents KAgentSys-Lite → Ello5
ellofive agents kwai "Summarize what an elite local coding agent should do"

# big-AGI UI (http://127.0.0.1:3080) → Ollama models
ellofive agents bigagi
```

## Connection map

```
AgentGPT / SuperAGI / KwaiAgents / OpenAI SDKs
        │  OPENAI_BASE_URL=http://127.0.0.1:11434/v1
        │  model=ellofive  (or ellofive-fast)
        ▼
   Ollama OpenAI API  ──►  Ello5 models
        ▲
big-AGI (OLLAMA_API_HOST=http://127.0.0.1:11434)
        ▲
ellofive agents run  (integrations/ello5-agent)
```

Elloten gateway also exposes `POST /v1/chat/completions` on `:3000` as an alternate OpenAI-compatible entry.

## Vendor trees

Clones live under `vendor/` (gitignored). Re-clone anytime:

```bash
ellofive agents install
```

## LMOps ideas to borrow

- Automatic prompt optimization / structured prompting for Ello5 system prompts  
- Longer-context / retrieval patterns for `memory/`  
- Lossless acceleration concepts when serving larger bases  

## Why not full AgentGPT/SuperAGI here?

No Docker in this Cloud Agent image. Their compose stacks need MySQL/Postgres/Redis. Use them on a Docker host with:

```bash
export OPENAI_API_KEY=ollama
export OPENAI_API_BASE=http://127.0.0.1:11434/v1
# model name: ellofive
```
