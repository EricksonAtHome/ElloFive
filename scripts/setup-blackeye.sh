#!/usr/bin/env bash
# Install BlackeyE3.1 for terminal CLI (SA blackeye / blackeye).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${ROOT}/tools/BlackeyE3.1"
REPO="${BLACKEYE_REPO:-https://github.com/EricksonAtHome/BlackeyE3.1.git}"

echo "==> Blackeye CLI install"

if [[ ! -d "${DEST}/.git" ]]; then
  mkdir -p "${ROOT}/tools"
  git clone --depth 1 "${REPO}" "${DEST}"
else
  echo "  already cloned: ${DEST}"
  git -C "${DEST}" pull --ff-only || true
fi

cd "${DEST}"
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "  wrote .env.local (set NEXT_PUBLIC_PROJECT_ID if you need WalletConnect web later)"
fi
if [[ ! -f tokens.json ]] || grep -q your_generated_token_here tokens.json 2>/dev/null; then
  echo '{}' > tokens.json
fi

npm ci --no-fund --no-audit

# Install / refresh terminal CLI into the Blackeye tree
install -m 755 "${ROOT}/integrations/blackeye/blackeye.js" "${DEST}/bin/blackeye.js"
chmod +x "${ROOT}/bin/blackeye" "${ROOT}/bin/SA" "${DEST}/bin/pig.js"

mkdir -p "${HOME}/.local/bin"
ln -sfn "${ROOT}/bin/blackeye" "${HOME}/.local/bin/blackeye"
ln -sfn "${ROOT}/bin/SA" "${HOME}/.local/bin/SA"
ln -sfn "${ROOT}/bin/SA" "${HOME}/.local/bin/sa"

echo ""
echo "==> Blackeye CLI ready (terminal only — does not open a webpage)"
echo "    SA blackeye status"
echo "    SA blackeye token create --no-prompt"
echo "    SA blackeye shell"
echo "    blackeye help"
echo ""
echo "Ensure ~/.local/bin is on PATH:"
echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
