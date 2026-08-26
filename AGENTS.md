# AGENTS.md

## Cursor Cloud specific instructions

ElloFive is a local LLM runtime that wraps **Ollama**, plus a Node/Express **FRC7 FRCL** layer and a Python **DeepFakes** deep-learning toolkit. Standard commands live in `package.json` scripts and `README.md`; the notes below are the non-obvious startup/run caveats for this environment.

### Cloud Agent sandbox
- Install (idempotent): `bash scripts/cloud-agent-install.sh` — Ollama binary if missing, `npm ci`, Ubuntu Cloud Lab setup, builds models only when absent.
- Start: `bash scripts/cloud-agent-start.sh` — starts Ollama if needed, then Elloten API/UI on `:3000` (foreground).
- Do not put `ollama serve` alone in install; keep durable weights in the snapshot and start services on boot via `start`.

### Ubuntu Cloud Lab (“test my app”)
- This VM is **Ubuntu 24.04 LTS** (enterprise open source) with `DISPLAY=:1` for computer-use.
- When the user says “test my app” / “open Ubuntu and check …”:
  1. `ellofive ubuntu status` (or `ellofive lab status`)
  2. Start the app under test (e.g. `ellofive api`)
  3. `ellofive ubuntu test <url>` — opens Chrome on the Ubuntu desktop
  4. Use computer-use to click/type, screenshot, and report PASS/FAIL
- Playbook: [`docs/ubuntu-cloud-lab.md`](docs/ubuntu-cloud-lab.md)

### What the VM snapshot already contains (installed during env setup)
- The `ollama` binary (`/usr/local/bin/ollama`) and pulled models in `~/.ollama`: `llama3.2:3b` (base) plus the custom `ellofive` and `models5` models.
- `node_modules/` (from `npm install`) and the DeepFakes venv at `.venv-deepfakes/` (TensorFlow 2.16 / Keras 3 / OpenCV). The gitignored `.ellofive-deepfakes.env` records the venv path.
- The update script only runs `npm install` on startup — it deliberately does NOT reinstall Ollama, re-pull models, or rebuild the venv (those are heavy and already snapshotted).

### Starting services (nothing is auto-started on boot)
- The Ollama runtime is NOT running on a fresh VM (it was started as a plain process, not systemd). Start it before anything else needs inference: `ollama serve` (or `npm run serve`), then wait until `curl -sf http://127.0.0.1:11434/api/tags` succeeds. Port `11434`.
- `ellofive frc <file.frcl>` auto-starts the runtime if it is down, but `npm run api` and `node frc/cli.js --prompt ...` assume it is already up.
- FRC Express API: `npm run api` → listens on port `3000` (`GET /health`, `POST /run/:model`). Upstream LLM host is the Ollama runtime above.
- Run all long-lived services (ollama serve, npm run api) in a persistent tmux session.

### If models are missing (e.g. `~/.ollama` was not preserved)
Recreate with `bash scripts/setup-model.sh` (pulls `llama3.2:3b` ~2GB, then builds `ellofive` + `models5` from `models/Modelfile*`). Override base model via `ELLOFIVE_BASE_MODEL`.

### DeepFakes toolkit
- Invoke via `bash bin/ellofive-dl <status|smoke|extract|train|convert>` (or `ellofive dl ...`). Import checks/help: `ellofive dl smoke`.
- `face_recognition`/`dlib` is intentionally NOT installed; the code falls back to an OpenCV Haar cascade detector (`ellofive dl status` reporting `face_recognition missing` is expected). Set `ELLOFIVE_INSTALL_DLIB=1` before `scripts/setup-deepfakes.sh` only if you truly need dlib.
- WARNING: `scripts/setup-deepfakes.sh` does `rm -rf` on the venv and rebuilds it from scratch (slow). Do not run it casually — the venv already exists from the snapshot; only rerun if the venv is broken/missing.

### Auto-learn memory
- Local save when user asks / AI tasks finish: `ellofive memory auto on` (default learn=1).
- GitHub upload: `ellofive memory sync` or `ellofive memory auto sync-on`.
- Docs: [`docs/memory-learn.md`](docs/memory-learn.md). Sessions stay gitignored; `knowledge-base.md` + `learnings/` + `tasks/` sync.

### Test / lint / build
- Tests: `npm test` (runs `scripts/test-ellofive.sh`, an 11-check smoke suite covering the runtime, models, FRCL execution, and DeepFakes). Requires the Ollama runtime (the script starts it if needed) and the DeepFakes venv.
- No lint or build step is configured (no ESLint/TS; sources are plain ESM JS + bash). The nearest static check is `node --check frc/*.js` and `bash -n` on the shell scripts.

### The `ellofive` CLI
`bin/ellofive`, `bin/ellofive-dl`, and `bin/ellofive-ubuntu` are symlinked into `~/.local/bin` by `scripts/cloud-agent-install.sh` / `scripts/install.sh`. If those symlinks are not present on a fresh VM, call the scripts directly (`bin/ellofive ...`) or add `bin/` to `PATH`. Note `ellofive-frc` is a package bin but is not globally linked; use `node frc/cli.js` for the FRC CLI.
