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

# Ensure venv support (common failure on minimal Ubuntu images)
if ! python3 -c 'import ensurepip, venv' 2>/dev/null; then
  echo "==> Installing python3-venv..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq "python3-venv" "python3-pip" "python3-dev" "build-essential" "cmake" || {
      echo "Could not install python3-venv automatically. Run:" >&2
      echo "  sudo apt-get install -y python3-venv python3-pip python3-dev cmake build-essential" >&2
      exit 1
    }
  else
    echo "python3-venv missing and apt-get unavailable." >&2
    exit 1
  fi
fi

rm -rf "${VENV}"
python3 -m venv "${VENV}"
# shellcheck disable=SC1091
source "${VENV}/bin/activate"

python -m pip install --upgrade pip wheel setuptools

echo "==> Installing DeepFakes Python deps..."
if [[ -f "${DF_DIR}/requirements-ellofive.txt" ]]; then
  python -m pip install -r "${DF_DIR}/requirements-ellofive.txt"
else
  python -m pip install "opencv-python>=4.5,<4.11" "numpy<2" tqdm scikit-image h5py "keras>=2.10,<3" "tensorflow>=2.10,<2.16"
fi

# Optional face_recognition (often fails without full C++ toolchain).
# OpenCV Haar cascade fallback is built into lib/faces_detect.py.
if [[ "${ELLOFIVE_INSTALL_DLIB:-0}" == "1" ]]; then
  if python -m pip install face_recognition; then
    echo "face_recognition OK"
  else
    echo "Note: face_recognition not installed; using OpenCV Haar fallback." >&2
  fi
else
  echo "Using OpenCV Haar face detector (set ELLOFIVE_INSTALL_DLIB=1 to try dlib)."
fi

cat > "${ROOT}/.ellofive-deepfakes.env" <<EOF
ELLOFIVE_DF_ROOT=${DF_DIR}
ELLOFIVE_DF_VENV=${VENV}
EOF

echo "==> Verifying imports..."
"${VENV}/bin/python" - <<'PY'
import importlib
mods = ["cv2", "numpy", "tqdm", "keras", "tensorflow"]
missing = []
for m in mods:
    try:
        importlib.import_module(m)
        print(f"  OK  {m}")
    except Exception as e:
        print(f"  BAD {m}: {e}")
        missing.append(m)
if missing:
    raise SystemExit(1)
print("DeepFakes core imports OK")
PY

cd "${DF_DIR}"
"${VENV}/bin/python" faceswap.py -h >/tmp/ellofive-df-help.txt 2>&1 || true
if grep -qiE 'extract|train|convert' /tmp/ellofive-df-help.txt; then
  echo "==> faceswap.py help OK"
else
  echo "==> faceswap.py help output:"
  sed -n '1,40p' /tmp/ellofive-df-help.txt || true
fi

echo ""
echo "DeepFakes venv ready: ${VENV}"
echo "Try:"
echo "  ellofive dl status"
echo "  ellofive dl extract -h"
echo "  ellofive dl smoke"
