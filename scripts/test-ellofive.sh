#!/usr/bin/env bash
# Smoke-test ElloFive + FRC7 + DeepFakes
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

if ! curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  echo "  .... starting runtime"
  nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
  for _ in $(seq 1 30); do
    curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if curl -sf "${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
  ok "runtime reachable at ${OLLAMA_HOST}"
else
  bad "runtime reachable at ${OLLAMA_HOST}"
fi

if ! ollama list 2>/dev/null | grep -qE '^ellofive\b'; then
  echo "  .... creating models via setup"
  bash "${ROOT}/scripts/setup-model.sh"
fi

if ollama list 2>/dev/null | grep -qE '^ellofive\b'; then ok "ellofive model present"; else bad "ellofive model present"; fi
if ollama list 2>/dev/null | grep -qE '^models5\b'; then ok "models5 alias present"; else bad "models5 alias present"; fi
if ollama list 2>/dev/null | grep -qE '^ellofive-fast\b'; then ok "ellofive-fast present"; else bad "ellofive-fast present"; fi

if [[ -f "${ROOT}/models/elite-coding-system.md" ]]; then ok "elite coding system present"; else bad "elite coding system present"; fi
if [[ -f "${ROOT}/memory/knowledge-base.md" ]]; then ok "local memory KB present"; else bad "local memory KB present"; fi

# Quality: identity check via chat API (Elite Coding System)
CHAT="$(curl -sf "${OLLAMA_HOST}/api/chat" -H 'Content-Type: application/json' -d '{"model":"ellofive","messages":[{"role":"user","content":"In one short sentence, who are you?"}],"stream":false,"options":{"num_predict":120}}' || true)"
if echo "${CHAT}" | grep -qiE 'ellofive|elite|software engineering|production'; then
  ok "ellofive elite identity"
else
  echo "  reply was: ${CHAT}" | head -c 500; echo
  bad "ellofive elite identity"
fi

MEM_OUT="$("${ROOT}/bin/ellofive-memory" list 2>&1 || true)"
if echo "${MEM_OUT}" | grep -qi 'knowledge-base'; then ok "ellofive memory list"; else bad "ellofive memory list"; fi

NODE_OUT="$(node "${ROOT}/frc/cli.js" "${ROOT}/examples/hello.frcl" 2>&1 || true)"
if echo "${NODE_OUT}" | grep -qiE 'ElloFive|FRC|OUTPUT'; then
  ok "FRC7 FRCL via ElloFive"
else
  echo "${NODE_OUT}" | sed 's/^/  | /'
  bad "FRC7 FRCL via ElloFive"
fi

DEMO_OUT="$(node "${ROOT}/frc/cli.js" "${ROOT}/examples/frc7-demo.frcl" 2>&1 || true)"
if echo "${DEMO_OUT}" | grep -qiE 'OUTPUT|Docker|FRC|latency'; then
  ok "FRC7 demo.frcl block parse"
else
  echo "${DEMO_OUT}" | sed 's/^/  | /'
  bad "FRC7 demo.frcl block parse"
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

# DeepFakes functional smoke (auto-setup if needed)
if [[ "${ELLOFIVE_TEST_DL:-1}" == "1" ]]; then
  if "${ROOT}/bin/ellofive-dl" smoke >/tmp/ellofive-dl-smoke.log 2>&1; then
    ok "DeepFakes smoke"
  else
    echo "  .... DeepFakes smoke log:"
    sed -n '1,80p' /tmp/ellofive-dl-smoke.log | sed 's/^/  | /'
    bad "DeepFakes smoke"
  fi
fi

echo ""
echo "Results: ${pass} passed, ${fail} failed"
[[ "${fail}" -eq 0 ]]
