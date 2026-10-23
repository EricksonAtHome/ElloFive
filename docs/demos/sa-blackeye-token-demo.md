# Ello5 CLI → SA blackeye token demo

**SA = Start Application** (terminal tools only — no webpage)

Flow recorded in the terminal:

1. `SA list` — Start Application tools (`blackeye`, `pig`)
2. `SA blackeye status` — opens Blackeye CLI (session not logged in)
3. `SA blackeye token create --no-prompt` — **NEW TOKEN GENERATED**
4. `SA blackeye auth <token>` — CLI login
5. `SA blackeye whoami` / `token list` — confirm session
6. **PASS** — Blackeye opened · login token created

Artifacts:
- Video (~16s): `sa-blackeye-token-demo.mp4`
- Cursor recording: `sa-blackeye-token-demo-cursor.mp4`
- Screens: `sa-blackeye-demo-start.png`, `sa-blackeye-demo-token.png`, `sa-blackeye-demo-login.png`
