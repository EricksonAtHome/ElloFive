#!/usr/bin/env bash
# Create an isolated venv for ElloFive DeepFakes (yeahreum/DeepFakes)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DF_DIR="${ROOT}/deeplearning/DeepFakes"
VENV="${ELLOFIVE_DF_VENV:-${ROOT}/.venv-deepfakes}"

if [[ ! -d "${DF_DIR}" ]]; then
  echo "DeepFakes not found at ${DF_DIR}" >&2
  exit 1
fi

echo "==> ElloFive Deep Learning setup"
echo "    Source: https://github.com/yeahreum/DeepFakes.git"
echo "    Path:   ${DF_DIR}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi

python3 -m venv "${VENV}"
# shellcheck disable=SC1091
source "${VENV}/bin/activate"

python -m pip install --upgrade pip wheel setuptools

# Prefer ElloFive-resolvable pins (upstream pins ancient TF 1.x).
# Full GPU training still needs CUDA + compatible TensorFlow per DeepFakes docs.
if [[ -f "${DF_DIR}/requirements-ellofive.txt" ]]; then
  python -m pip install -r "${DF_DIR}/requirements-ellofive.txt" || {
    echo "Warning: some ML deps failed to install. See deeplearning/DeepFakes/INSTALL.md" >&2
  }
else
  python -m pip install "opencv-python>=4.5,<4.11" "numpy<2" tqdm scikit-image h5py "keras>=2.10,<3" "tensorflow>=2.10,<2.16" || true
fi

# Optional face detection stack (may need build tools / cmake for dlib)
python -m pip install face_recognition dlib || {
  echo "Note: face_recognition/dlib not installed yet (optional for extract)." >&2
  echo "      Install system deps (cmake, build-essential) then re-run this script." >&2
}

cat > "${ROOT}/.ellofive-deepfakes.env" <<EOF
ELLOFIVE_DF_ROOT=${DF_DIR}
ELLOFIVE_DF_VENV=${VENV}
EOF

echo ""
echo "DeepFakes venv ready: ${VENV}"
echo "Run: ellofive dl status"
echo "Or:  ellofive dl extract -h"
