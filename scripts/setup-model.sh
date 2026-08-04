#!/usr/bin/env bash
# Create the ElloFive custom LLM (+ FRC7 models5 alias)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELLOFIVE_HOST="${ELLOFIVE_HOST:-http://127.0.0.1:11434}"
export OLLAMA_HOST="${OLLAMA_HOST:-$ELLOFIVE_HOST}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found. Run: bash scripts/install.sh" >&2
  exit 1
fi

if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "==> Starting ElloFive runtime (ollama serve)..."
  nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
  for i in $(seq 1 30); do
    if curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "ElloFive runtime is not reachable at ${OLLAMA_HOST}" >&2
  exit 1
fi

BASE_MODEL="${ELLOFIVE_BASE_MODEL:-llama3.2:1b}"
echo "==> Ensuring base model ${BASE_MODEL}..."
ollama pull "${BASE_MODEL}"

# Keep Modelfile FROM line in sync when override is used
MODELFILE="${ROOT}/models/Modelfile"
if [[ "${BASE_MODEL}" != "llama3.2:1b" ]]; then
  TMP="$(mktemp)"
  sed "s|^FROM .*|FROM ${BASE_MODEL}|" "${MODELFILE}" > "${TMP}"
  MODELFILE="${TMP}"
fi

echo "==> Creating your LLM: ellofive"
ollama create ellofive -f "${MODELFILE}"

echo "==> Creating FRC7 alias: models5"
ollama create models5 -f "${ROOT}/models/Modelfile.models5"

echo ""
echo "ElloFive models ready:"
ollama list
echo ""
echo "Try: ellofive run ellofive"
echo "Or:  ellofive frc examples/hello.frcl"
