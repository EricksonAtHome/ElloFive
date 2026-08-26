# SA = Start Application (simple guide)

## What went wrong on your Mac

You typed `SA list` inside **`ollama run ellofive`**.

The old model did **not** know ElloFive’s meaning of SA, so it guessed **“Software Architecture”** and listed microservices, SOA, etc.

That is wrong for this project.

## What SA means here

**SA = Start Application** — a real terminal command that starts local tools.

It does **not** mean software architecture.

```bash
# Install / update from this repo, then:
export PATH="$PWD/bin:$PATH"   # or: bash scripts/install.sh

SA list
SA blackeye status
SA blackeye token create --no-prompt
SA blackeye auth <token>
SA blackeye whoami
```

## How to chat correctly

Prefer:

```bash
ellofive chat
>>> SA list
>>> SA blackeye status
>>> Write a secure /health endpoint
```

In `ellofive chat`, lines starting with `SA` or `blackeye` **run the real CLI**.  
Coding questions still go to the AI.

Avoid relying on plain `ollama run ellofive` for `SA …` until you rebuild the model:

```bash
git pull
ellofive setup    # rebuilds model with SA = Start Application rules
```

## Blackeye in one sentence

Blackeye here = **token login CLI** (create token → auth → whoami). Terminal only. No webpage.

## Docs

- `docs/blackeye-cli.md` — full Blackeye CLI
- `docs/prompts.md` — `ellofive prompts sa`
- Demo video: `docs/demos/sa-blackeye-token-demo.mp4`
