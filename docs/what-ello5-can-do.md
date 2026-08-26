# What Ello5 can do — good and bad

Honest capability map for **Ello5** (the model), **Elloten** (chat UX), and **ElloFive** (local CLI / product).

---

## In one line

Ello5 is a **private, local coding AI** that runs on your machine via Ollama. It is strong at software engineering chat, scripts, and local tooling — and weaker than big cloud models at world knowledge, long agents, and always-correct answers.

---

## Good — what it does well

### Coding & engineering
- Writes and reviews **production-oriented** code (security, tests, SOLID/DRY/KISS mindset from the Elite Coding System prompt).
- Helps with APIs, CLIs, scripts, refactors, debugging ideas, and architecture notes.
- Works **offline / on-LAN** — no code leaves your machine by default.

### Chat & product surface
- **Elloten** UI at `:3000` / `ai.ello5.com` for ChatGPT-like chat with Ello5.
- REST API: `/v1/chat`, `/v1/chat/completions` (OpenAI-compatible), `/run/:model`, `/health`.
- Two speeds: **`ellofive`** (Pro, ~7B) and **`ellofive-fast`** (low latency, ~3B).

### Local memory
- On-disk knowledge base (`ellofive memory`) for preferences, decisions, and project notes that feed into chat.

### Tools around the model
| Tool | What it is good for |
| --- | --- |
| `ellofive frc` | Run FRC7 FRCL workflows |
| `ellofive dl` | DeepFakes toolkit (extract / train / convert; OpenCV fallback) |
| `ellofive ubuntu` | Open Ubuntu desktop + Chrome to **test an app** (computer-use) |
| `ellofive agents` | Plan→execute agent loop; KwaiAgents; big-AGI UI on Ello5 |

### Privacy & control
- Models and weights stay under **your** Ollama install.
- You choose base model size (`qwen2.5:7b`, larger if you have RAM, etc.).
- Domains split UX / API / runtime (`ai` / `api` / `ft.svr` on `ello5.com`).

### Integration
- Other agents (AgentGPT, SuperAGI, KwaiAgents, OpenAI SDKs) can treat Ello5 as an OpenAI backend:  
  `OPENAI_API_BASE=http://127.0.0.1:11434/v1` · model `ellofive`.

---

## Bad — limits and failure modes

### Model size & quality
- Pro is roughly **7B** (fast is **3B**). Expect weaker reasoning than GPT-4-class / Claude-class cloud models.
- Can **hallucinate** APIs, libraries, versions, and “facts” (news, live prices, current events).
- Short answers are often better than long, multi-file “rewrite the whole repo” asks without grounding.

### Not a full autonomous employee
- Native agent loop is **simple** (plan a few tasks → execute → summarize). It is not a reliable long-running company agent.
- AgentGPT / SuperAGI need **Docker** (MySQL/Postgres/Redis). Without Docker you only get the OpenAI-compat hook, not their full UIs.
- Tool-use (browse, weather, etc. in KwaiAgents) depends on network, keys, and ChromeDriver — often flaky.

### Runtime & hardware
- Needs **Ollama running** and enough **RAM/disk** for weights (multi‑GB).
- No GPU in many Cloud Agent VMs → slower inference.
- Cold start / first token can feel sluggish on small machines.

### Deep learning toolkit
- DeepFakes path is for research/experiment tooling; **`face_recognition` / dlib` are not installed by default** (OpenCV Haar fallback).
- Training/convert is heavy and easy to misuse — not a “one click pro video swap” product.

### Ubuntu “test my app”
- Needs a **graphical display** (`DISPLAY=:1`) and Chrome.
- Chat UI can hit `Error: fetch failed` if the API/Ollama is overloaded or restarted mid-request.
- Computer-use testing is **manual for the agent** (click/type/screenshot) — not a full Playwright suite unless you add one.

### Product / ops gaps
- Domains (`ello5.com`) need real DNS + reverse proxy to work publicly; local `:3000` is the default.
- No built-in multi-user auth, billing, or team sync (unlike hosted ChatGPT).
- Cloud Dependabot may flag many issues in vendored/ML trees — treat vendor clones carefully.

### Safety & misuse
- Will help with legitimate coding; it should **not** be used for scams, malware, unauthorized access, or deceptive deepfakes of real people without consent.
- Local ≠ risk-free: anyone with shell access to the machine can use the model and memory files.

---

## Quick “can it …?” cheat sheet

| Ask | Answer |
| --- | --- |
| Write / review code locally? | **Yes** — core strength |
| Private chat without OpenAI keys? | **Yes** |
| Remember my preferences? | **Yes** — `ellofive memory` |
| Browse the live web / real-time news? | **Weak / no** unless you add tools + network |
| Replace GPT-4 for hard reasoning? | **Usually no** |
| Run multi-day autonomous agents alone? | **Not reliably** |
| Open Ubuntu and click-test my app? | **Yes** — Cloud Lab + computer-use |
| Plug into AgentGPT / OpenAI SDKs? | **Yes** — OpenAI-compatible `/v1` |
| Pro deepfake studio out of the box? | **No** — limited DL toolkit |

---

## Commands to try the good parts

```bash
ellofive serve
ellofive chat "Write a secure FastAPI /health with tests"
ellofive memory add "Prefer TypeScript strict mode"
ellofive api                          # Elloten on :3000
ellofive ubuntu test http://127.0.0.1:3000
ellofive agents run "Outline a private local coding agent"
```

More detail: [Elite Coding System](../models/elite-coding-system.md) · [Ubuntu Cloud Lab](ubuntu-cloud-lab.md) · [Agent stack](agent-stack.md) · [Domains](domains.md)
