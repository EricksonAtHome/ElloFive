#!/usr/bin/env bash
# Build ElloFive Elite Coding models (Pro + Fast + models5)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELLOFIVE_HOST="${ELLOFIVE_HOST:-http://127.0.0.1:11434}"
export OLLAMA_HOST="${OLLAMA_HOST:-$ELLOFIVE_HOST}"

BASE_MODEL="${ELLOFIVE_BASE_MODEL:-qwen2.5:7b}"
FAST_MODEL="${ELLOFIVE_FAST_MODEL:-llama3.2:3b}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found. Run: bash scripts/install.sh" >&2
  exit 1
fi

if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "==> Starting ElloFive runtime..."
  nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
  for _ in $(seq 1 45); do
    curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "ElloFive runtime is not reachable at ${OLLAMA_HOST}" >&2
  exit 1
fi

avail_mb="$(awk '/MemAvailable:/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 8000)"
echo "==> MemAvailable: ${avail_mb} MB"

# Safety: never auto-default to 14B on ~15GB boxes (OOM risk)
if [[ "${BASE_MODEL}" == *":14b"* && "${avail_mb}" -lt 12000 ]]; then
  echo "==> Refusing ${BASE_MODEL} on low RAM — using qwen2.5:7b"
  BASE_MODEL="qwen2.5:7b"
fi

echo "==> Building Modelfile from elite-coding-system.md"
ELLOFIVE_BASE_MODEL="${BASE_MODEL}" bash "${ROOT}/scripts/build-modelfile.sh"

echo "==> Ensuring Pro base: ${BASE_MODEL}"
ollama pull "${BASE_MODEL}"

echo "==> Ensuring Fast base: ${FAST_MODEL}"
ollama pull "${FAST_MODEL}"

echo "==> Creating ElloFive Pro (Elite Coding System): ellofive"
ollama create ellofive -f "${ROOT}/models/Modelfile"

FASTFILE="${ROOT}/models/Modelfile.fast"
if ! grep -q "^FROM ${FAST_MODEL}$" "${FASTFILE}"; then
  TMPF="$(mktemp)"
  sed "s|^FROM .*|FROM ${FAST_MODEL}|" "${FASTFILE}" > "${TMPF}"
  FASTFILE="${TMPF}"
fi

echo "==> Creating ElloFive Fast: ellofive-fast"
ollama create ellofive-fast -f "${FASTFILE}"

echo "==> Creating FRC7 alias: models5"
ollama create models5 -f "${ROOT}/models/Modelfile.models5"

cat > "${ROOT}/.ellofive-models.env" <<EOF
ELLOFIVE_BASE_MODEL=${BASE_MODEL}
ELLOFIVE_FAST_MODEL=${FAST_MODEL}
ELLOFIVE_PRO_NAME=ellofive
ELLOFIVE_FAST_NAME=ellofive-fast
EOF

echo ""
ollama list
echo ""
echo "Elite identity check..."
ollama run ellofive 'In one short sentence: who are you and what is your primary mission?' || true
echo ""
echo "Try: ellofive chat"
echo "     ellofive memory show"
echo "     ellofive frc examples/hello.frcl"
