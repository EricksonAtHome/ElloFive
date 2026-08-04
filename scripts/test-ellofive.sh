#!/usr/bin/env bash
# Smoke-test ElloFive + FRC7 FRCL integration
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELLOFIVE_HOST="${ELLOFIVE_HOST:-http://127.0.0.1:11434}"
export OLLAMA_HOST="${OLLAMA_HOST:-$ELLOFIVE_HOST}"
export PATH="${ROOT}/bin:${PATH}"

pass=0
fail=0

ok() { echo "  PASS  $1"; pass=$((pass + 1)); }
bad() { echo "  FAIL  $1"; fail=$((fail + 1)); }

echo "==> ElloFive test suite"

if command -v ollama >/dev/null 2>&1; then ok "ollama installed"; else bad "ollama installed"; fi
if [[ -x "${ROOT}/bin/ellofive" ]]; then ok "ellofive CLI executable"; else bad "ellofive CLI executable"; fi

if curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  ok "runtime reachable at ${OLLAMA_HOST}"
else
  bad "runtime reachable at ${OLLAMA_HOST}"
  echo "Start with: ellofive serve" >&2
fi

if ollama list 2>/dev/null | grep -qE '^ellofive\b'; then
  ok "ellofive model present"
else
  echo "  .... creating models via setup"
  bash "${ROOT}/scripts/setup-model.sh"
  if ollama list 2>/dev/null | grep -qE '^ellofive\b'; then ok "ellofive model present"; else bad "ellofive model present"; fi
fi

if ollama list 2>/dev/null | grep -qE '^models5\b'; then ok "models5 alias present"; else bad "models5 alias present"; fi

REPLY="$(ollama run ellofive 'Reply with exactly: ELLOFIVE_OK' --verbose=false 2>/dev/null | tr -d '\r' || true)"
if echo "${REPLY}" | grep -qi 'ELLOFIVE'; then
  ok "ellofive inference"
else
  echo "  reply was: ${REPLY}"
  bad "ellofive inference"
fi

NODE_OUT="$(node "${ROOT}/frc/cli.js" "${ROOT}/examples/hello.frcl" 2>&1 || true)"
if echo "${NODE_OUT}" | grep -qiE 'output|ElloFive|FRC|result'; then
  ok "FRC7 FRCL via ElloFive"
else
  echo "${NODE_OUT}" | sed 's/^/  | /'
  bad "FRC7 FRCL via ElloFive"
fi

if [[ -f "${ROOT}/deeplearning/DeepFakes/faceswap.py" ]]; then
  ok "DeepFakes deep learning present"
else
  bad "DeepFakes deep learning present"
fi

DL_OUT="$("${ROOT}/bin/ellofive-dl" status 2>&1 || true)"
if echo "${DL_OUT}" | grep -qi 'yeahreum/DeepFakes'; then
  ok "ellofive dl status"
else
  echo "${DL_OUT}" | sed 's/^/  | /'
  bad "ellofive dl status"
fi

echo ""
echo "Results: ${pass} passed, ${fail} failed"
[[ "${fail}" -eq 0 ]]
