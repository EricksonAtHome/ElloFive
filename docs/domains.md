# Ello5 domain map (`ello5.com`)

**Elloten** is the web UX tool. **Ello5** is the AI model / mode.  
`ello5.com` hosts Elloten, the API, and the Ello5 runtime. Local CLI stays **ElloFive** (`ellofive`).

## Recommended hosts

| Host | Role | Default port (local) |
| --- | --- | --- |
| `ai.ello5.com` | **Elloten** — chat UI/UX (ChatGPT × Claude × Lovable mix) | `:3080` (or via Caddy `:443`) |
| `api.ello5.com` | **API** — REST for chat / FRC `/run` | `:3000` |
| `ft.svr.ello5.com` | **Runtime** — Ello5 model serve / inference (Ollama) | `:11434` |
| `ello5.com` | Apex → redirect to `ai.ello5.com` | — |

### Why this layout

- **`ft.svr`** = front tier on the **server fleet** (`*.svr.ello5.com`). That is where Ello5 runs.
- **`api`** stays short and public-facing for clients and integrations.
- **`ai`** serves **Elloten**, the human chat workspace for Ello5.

## Optional server-fleet hosts

| Host | Role |
| --- | --- |
| `svr.ello5.com` | Fleet root / status |
| `ops.svr.ello5.com` | Health, metrics, operator |
| `dl.svr.ello5.com` | Deep learning jobs (optional) |

## DNS (example)

```text
ai.ello5.com          A / CNAME → your edge
api.ello5.com         A / CNAME → your edge
ft.svr.ello5.com      A / CNAME → GPU/CPU runtime box
ello5.com             A / CNAME → edge (redirect → ai)
```

TLS: terminate at the edge (Caddy / nginx). See [`deploy/Caddyfile`](../deploy/Caddyfile).

## Local env

Copy [`config/hosts.env.example`](../config/hosts.env.example):

```bash
export ELLO5_DOMAIN=ello5.com
export ELLO5_UI_ORIGIN=https://ai.ello5.com
export ELLO5_API_ORIGIN=https://api.ello5.com
export ELLO5_RUNTIME_HOST=https://ft.svr.ello5.com
# Local fallbacks:
export ELLOFIVE_HOST=http://127.0.0.1:11434
export ELLOFIVE_PORT=3000
```

## Request flow

```text
Browser  →  ai.ello5.com  (UI)
              ↓
           api.ello5.com  (API gateway)
              ↓
        ft.svr.ello5.com  (Ello5 AI runtime / Ollama)
```

Locally: `ellofive api` serves both the API and the UI from one process; Caddy splits hosts in production.
