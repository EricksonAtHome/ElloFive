# Ello5 / SA prompt catalog

**SA = Start Application.**  
When the user says `SA <tool>`, start that tool in the **terminal** (CLI). Do not open a webpage unless they explicitly ask for a web UI.

## Standard prompt (always available)

```
SA means Start Application. When I say SA <tool>, start that terminal tool
(never open a webpage unless I ask). Available tools include: blackeye,
ellofive api, ellofive ubuntu, ellofive agents. Confirm the tool, the exact
CLI command, and run it if you have a shell.
```

Machine-readable catalog: [`catalog.json`](catalog.json)

## Quick SA prompts

| Say this | Meaning |
| --- | --- |
| `SA blackeye` | Start Blackeye CLI (`SA blackeye status`) |
| `SA elloten` | Start Elloten API/UI (`ellofive api`) |
| `SA ubuntu` | Start Ubuntu Cloud Lab app test |
| `SA agents` | Start Ello5 agent stack / run a goal |
| `SA list` | List Start Application tools |

## More AI tool prompts

Copy any of these into Elloten or `ellofive chat "…"`.

### Coding
- **Secure API** — Write a production-ready secure FastAPI `/health` with tests and OWASP notes.
- **Code review** — Rank repo issues CRITICAL→LOW; fix the top item safely.
- **Refactor** — SOLID/DRY/KISS without behavior change; verify with tests.
- **Add tests** — Cover the riskiest untested path; show run commands.

### Agents & system
- **Autonomous mission** — Map system → inventory → top 5 fixes → report 1–10 (no fake “I changed code”).
- **RAG plan** — Minimal retrieval for source/docs; measure less hallucination.
- **Model router** — fast / pro / search / sandbox routing table.
- **Perf** — Cold start & latency wins for Ello5.

### Memory & security
- **Save preference** — Store lasting prefs via `ellofive memory`.
- **Hardening** — Secrets, CORS, deps, tool boundaries.

## CLI

```bash
# List prompts
ellofive prompts
ellofive prompts show sa-standard
ellofive prompts show code-secure-api

# Start Application
SA list
SA blackeye status
```

## Elloten chips

Welcome-screen suggestion buttons load from this catalog’s featured set (SA + coding + agents).
