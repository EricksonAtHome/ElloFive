# ElloFive auto-learn memory

ElloFive **saves and learns** when:

1. The **user asks** the AI (`ellofive ask …`, `ellofive chat …`, Elloten `POST /v1/chat`)
2. An **AI task finishes** (`ellofive memory task …` or `POST /v1/memory/task`)

Learnings are written locally under `memory/`, then optionally **uploaded to GitHub**.

## Quick start

```bash
# Local auto-learn (default ON)
ellofive memory auto on
ellofive memory auto status

# Ask → auto-saves to learnings/ + knowledge-base.md
ellofive ask "Prefer TypeScript strict mode in this repo"

# Record a finished AI task
ellofive memory task "Add /health tests" --result "PASS npm test"

# Upload curated memory to GitHub (current branch)
ellofive memory sync

# Or: learn + push after every ask/task
ellofive memory auto sync-on
```

## What gets saved

| Path | Purpose | GitHub |
| --- | --- | --- |
| `memory/knowledge-base.md` | Durable prefs + **Recent learnings** | synced |
| `memory/learnings/YYYY-MM-DD.md` | Daily ask/task digests | synced |
| `memory/tasks/*.md` | Task goal/result reports | synced |
| `memory/sessions.md` | Raw session tail | **local only** (gitignored) |
| `memory/.auto-learn.env` | Learn/sync toggles | **local only** |

## Privacy

- Default: **local learn ON**, **GitHub auto-sync OFF**
- Enable push-after-learn: `ellofive memory auto sync-on`
- Disable all auto-save: `ellofive memory auto off`
- No hidden telemetry — sync only when you enable it or run `memory sync`

## Elloten API

- Every `POST /v1/chat` injects local memory context and calls `learn` after the reply
- `POST /v1/memory/task` `{ "goal": "…", "result": "…" }`
- `POST /v1/memory/sync` `{ "message": "optional commit msg" }`

## CLI reference

```bash
ellofive memory learn --ask "…" [--reply "…"] [--source cli|api|agent]
ellofive memory task "goal" [--result "…"]
ellofive memory auto status|on|off|sync-on|sync-off
ellofive memory sync [--message "…"]
ellofive memory sync-status
ellofive memory show
```
