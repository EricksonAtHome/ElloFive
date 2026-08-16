#!/usr/bin/env bash
# Cloud Agent sandbox start — Ollama runtime + Elloten API/UI (foreground).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"
export PATH="${HOME}/.local/bin:/usr/local/bin:${PATH}"
export OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"
export ELLOFIVE_HOST="${ELLOFIVE_HOST:-$OLLAMA_HOST}"
export ELLOFIVE_PORT="${ELLOFIVE_PORT:-3000}"

# Ensure Ollama is up (background), then keep Elloten API in the foreground.
if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "==> Starting Ollama runtime"
  nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
  for _ in $(seq 1 60); do
    if curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "Ollama failed to start. See /tmp/ellofive-serve.log" >&2
  exit 1
fi

echo "==> Elloten (Ello5) on http://127.0.0.1:${ELLOFIVE_PORT}"
exec node frc/server.js
