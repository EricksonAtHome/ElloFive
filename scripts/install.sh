#!/usr/bin/env bash
# Install Ollama and brand it as ElloFive
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> ElloFive installer"

if ! command -v zstd >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq zstd
  else
    echo "Please install zstd, then re-run this script." >&2
    exit 1
  fi
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "==> Downloading Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "==> Ollama already installed: $(ollama --version)"
fi

chmod +x "${ROOT}/bin/ellofive" "${ROOT}/scripts/"*.sh "${ROOT}/frc/cli.js" 2>/dev/null || true

# User-local brand symlink
mkdir -p "${HOME}/.local/bin"
ln -sfn "${ROOT}/bin/ellofive" "${HOME}/.local/bin/ellofive"

if [[ ":$PATH:" != *":${HOME}/.local/bin:"* ]]; then
  echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "${HOME}/.bashrc"
  export PATH="${HOME}/.local/bin:${PATH}"
fi

# Optional system-wide symlink when permitted
if [[ -w /usr/local/bin ]]; then
  ln -sfn "${ROOT}/bin/ellofive" /usr/local/bin/ellofive
elif command -v sudo >/dev/null 2>&1; then
  sudo ln -sfn "${ROOT}/bin/ellofive" /usr/local/bin/ellofive || true
fi

echo "==> ElloFive CLI ready: ellofive"
echo "    Start runtime:  ellofive serve"
echo "    Build your LLM: ellofive setup"
echo "    Run FRCL:       ellofive frc examples/hello.frcl"
