#!/usr/bin/env bash
# Cloud Agent sandbox install — durable, idempotent bootstrap for ElloFive / Elloten.
# Heavy one-time pieces (Ollama binary + models) are preserved in the environment snapshot.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

echo "==> ElloFive sandbox install"

# System deps (idempotent)
if command -v apt-get >/dev/null 2>&1; then
  if ! command -v zstd >/dev/null 2>&1 || ! command -v python3 >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq zstd curl python3-venv python3-pip || true
  fi
fi

# Ollama binary
if ! command -v ollama >/dev/null 2>&1; then
  echo "==> Installing Ollama"
  curl -fsSL https://ollama.com/install.sh | sh
fi

chmod +x bin/ellofive bin/ellofive-dl bin/ellofive-memory bin/ellofive-ubuntu scripts/*.sh frc/cli.js 2>/dev/null || true
mkdir -p "${HOME}/.local/bin"
ln -sfn "${ROOT}/bin/ellofive" "${HOME}/.local/bin/ellofive"
ln -sfn "${ROOT}/bin/ellofive-dl" "${HOME}/.local/bin/ellofive-dl"
ln -sfn "${ROOT}/bin/ellofive-memory" "${HOME}/.local/bin/ellofive-memory"
ln -sfn "${ROOT}/bin/ellofive-ubuntu" "${HOME}/.local/bin/ellofive-ubuntu"
export PATH="${HOME}/.local/bin:${PATH}"

# Ubuntu Cloud Lab (enterprise open-source Ubuntu) — Chrome + display tooling for "test my app"
echo "==> Ubuntu Cloud Lab setup"
bash "${ROOT}/bin/ellofive-ubuntu" setup || true

# Node deps
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

# Start runtime briefly only if models must be built
need_models=0
if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
  for _ in $(seq 1 40); do
    curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && break
    sleep 1
  done
fi

if curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  if ! ollama list 2>/dev/null | grep -qE '^ellofive\b'; then
    need_models=1
  fi
else
  need_models=1
fi

if [[ "${need_models}" == "1" ]]; then
  echo "==> Building ElloFive models (first run)"
  if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
    for _ in $(seq 1 60); do
      curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && break
      sleep 1
    done
  fi
  bash scripts/setup-model.sh
fi

echo "==> Sandbox install complete"
