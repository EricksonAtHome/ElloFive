#!/usr/bin/env bash
# Install Ollama, brand as ElloFive, build LLM + DeepFakes (auto)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTO_SETUP_LLM="${ELLOFIVE_AUTO_SETUP_LLM:-1}"
AUTO_SETUP_DL="${ELLOFIVE_AUTO_SETUP_DL:-1}"

echo "==> ElloFive installer (automatic)"

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq zstd python3-venv python3-pip python3-dev build-essential cmake || true
elif ! command -v zstd >/dev/null 2>&1; then
  echo "Please install zstd, then re-run this script." >&2
  exit 1
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "==> Downloading Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "==> Ollama already installed: $(ollama --version)"
fi

chmod +x "${ROOT}/bin/ellofive" "${ROOT}/bin/ellofive-dl" "${ROOT}/bin/ellofive-memory" "${ROOT}/bin/ellofive-ubuntu" "${ROOT}/scripts/"*.sh "${ROOT}/frc/cli.js" 2>/dev/null || true

mkdir -p "${HOME}/.local/bin"
ln -sfn "${ROOT}/bin/ellofive" "${HOME}/.local/bin/ellofive"
ln -sfn "${ROOT}/bin/ellofive-dl" "${HOME}/.local/bin/ellofive-dl"
ln -sfn "${ROOT}/bin/ellofive-memory" "${HOME}/.local/bin/ellofive-memory"
ln -sfn "${ROOT}/bin/ellofive-ubuntu" "${HOME}/.local/bin/ellofive-ubuntu"

if [[ ":$PATH:" != *":${HOME}/.local/bin:"* ]]; then
  echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "${HOME}/.bashrc"
  export PATH="${HOME}/.local/bin:${PATH}"
fi

if [[ -w /usr/local/bin ]]; then
  ln -sfn "${ROOT}/bin/ellofive" /usr/local/bin/ellofive
  ln -sfn "${ROOT}/bin/ellofive-dl" /usr/local/bin/ellofive-dl
elif command -v sudo >/dev/null 2>&1; then
  sudo ln -sfn "${ROOT}/bin/ellofive" /usr/local/bin/ellofive || true
  sudo ln -sfn "${ROOT}/bin/ellofive-dl" /usr/local/bin/ellofive-dl || true
fi

# Start runtime if needed
if ! curl -sf "${OLLAMA_HOST:-http://127.0.0.1:11434}/api/tags" >/dev/null 2>&1; then
  echo "==> Starting ElloFive runtime..."
  nohup ollama serve >/tmp/ellofive-serve.log 2>&1 &
  for _ in $(seq 1 40); do
    curl -sf "${OLLAMA_HOST:-http://127.0.0.1:11434}/api/tags" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if [[ "${AUTO_SETUP_LLM}" == "1" ]]; then
  echo "==> Building ElloFive LLM..."
  bash "${ROOT}/scripts/setup-model.sh"
fi

if [[ "${AUTO_SETUP_DL}" == "1" ]]; then
  echo "==> Setting up DeepFakes deep learning..."
  bash "${ROOT}/scripts/setup-deepfakes.sh" || echo "DeepFakes setup had warnings — run: ellofive dl setup"
fi

if [[ -d "${ROOT}" ]] && command -v npm >/dev/null 2>&1; then
  (cd "${ROOT}" && npm install --silent) || true
fi

echo ""
echo "==> ElloFive ready"
echo "    ellofive run ellofive"
echo "    ellofive frc examples/hello.frcl"
echo "    ellofive dl status"
echo "    ellofive dl smoke"
