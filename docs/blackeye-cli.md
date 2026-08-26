# Blackeye CLI (terminal only)

> **SA = Start Application** — not “software architecture”.  
> If `SA list` ever listed microservices/SOA, you used plain `ollama run ellofive` with an old model.  
> Fix: use `ellofive chat` (runs real SA commands) or rebuild with `ellofive setup`.  
> Simple guide: [`docs/SA.md`](SA.md)

[BlackeyE3.1](https://github.com/EricksonAtHome/BlackeyE3.1.git) is installed for **command-line use**.  
Nothing opens a webpage when you run `SA blackeye` / `blackeye`.

**SA = Start Application.**

## Install

```bash
bash scripts/setup-blackeye.sh
export PATH="$HOME/.local/bin:$PATH"
```

## Commands

```bash
# Via SA — Start Application
SA list
SA blackeye status
SA blackeye token create --no-prompt
SA blackeye token list
SA blackeye auth <token>
SA blackeye whoami
SA blackeye shell
SA blackeye logout

# Direct
blackeye help
blackeye token delete <token>
```

## AI prompts

Standard SA prompt and more tool prompts: [`docs/prompts.md`](prompts.md) · `ellofive prompts sa`

## What runs in the terminal

| Command | Purpose |
| --- | --- |
| `status` | Install path, token count, session |
| `token create` | Generate access token (optional password) |
| `token list` / `delete` | Manage `tokens.json` |
| `auth` | CLI login (session file) |
| `shell` | Interactive REPL |
| `whoami` / `logout` | Session info |

## What is not started

- `next dev` / browser UI / WalletConnect modal are **not** launched by these commands.
- WalletConnect still needs the Next.js web app if you want a browser wallet button later (`cd tools/BlackeyE3.1 && npm run dev`).

## Files

- Source clone: `tools/BlackeyE3.1/` (local install; gitignored)
- CLI source: `integrations/blackeye/blackeye.js`
- Launchers: `bin/blackeye`, `bin/SA`
