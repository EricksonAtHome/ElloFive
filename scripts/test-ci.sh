#!/usr/bin/env bash
# CI smoke tests that do NOT require Ollama / model weights.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

pass=0
fail=0
ok() { echo "  PASS  $1"; pass=$((pass + 1)); }
bad() { echo "  FAIL  $1"; fail=$((fail + 1)); }

echo "==> ElloFive CI smoke (no runtime)"

[[ -x bin/ellofive ]] && ok "ellofive executable" || bad "ellofive executable"
[[ -f web/index.html ]] && ok "Elloten UI" || bad "Elloten UI"
[[ -f docs/index.html ]] && ok "Pages index.html" || bad "Pages index.html"
[[ -f docs/assets/elloten-hero.jpg ]] && ok "Pages hero photo" || bad "Pages hero photo"
[[ -f docs/.nojekyll ]] && ok "Pages .nojekyll" || bad "Pages .nojekyll"
grep -qi 'Elloten' web/index.html && ok "UI brands Elloten" || bad "UI brands Elloten"
grep -qi 'Ello5' web/index.html && ok "UI brands Ello5" || bad "UI brands Ello5"

API_PORT="${ELLOFIVE_TEST_API_PORT:-3098}"
ELLOFIVE_PORT="${API_PORT}" node frc/server.js >/tmp/ello5-ci-api.log 2>&1 &
API_PID=$!
cleanup() { kill "${API_PID}" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 30); do
  curl -sf "http://127.0.0.1:${API_PORT}/v1/hosts" >/dev/null 2>&1 && break
  sleep 0.2
done

if ! kill -0 "${API_PID}" 2>/dev/null; then
  echo "  .... API failed to start:"
  sed -n '1,40p' /tmp/ello5-ci-api.log | sed 's/^/  | /'
  bad "API process running"
fi

HOSTS="$(curl -sf "http://127.0.0.1:${API_PORT}/v1/hosts" || true)"
if echo "${HOSTS}" | grep -q 'Elloten' && echo "${HOSTS}" | grep -q 'Ello5'; then
  ok "/v1/hosts product labels"
else
  echo "${HOSTS}" | sed 's/^/  | /'
  bad "/v1/hosts product labels"
fi

UI="$(curl -sf "http://127.0.0.1:${API_PORT}/" || true)"
if echo "${UI}" | grep -qi 'Elloten' && echo "${UI}" | grep -qi 'Ello5'; then
  ok "Elloten UI served by API"
else
  bad "Elloten UI served by API"
fi

CSS="$(curl -sf "http://127.0.0.1:${API_PORT}/styles.css" || true)"
[[ -n "${CSS}" ]] && ok "styles.css served" || bad "styles.css served"

cleanup
trap - EXIT

echo ""
echo "Results: ${pass} passed, ${fail} failed"
[[ "${fail}" -eq 0 ]]
