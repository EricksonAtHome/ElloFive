#!/usr/bin/env bash
# Build models/Modelfile from elite-coding-system.md + base model
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_MODEL="${ELLOFIVE_BASE_MODEL:-qwen2.5:7b}"
SYSTEM_FILE="${ROOT}/models/elite-coding-system.md"
OUT="${ROOT}/models/Modelfile"

if [[ ! -f "${SYSTEM_FILE}" ]]; then
  echo "Missing ${SYSTEM_FILE}" >&2
  exit 1
fi

# Escape nothing special beyond ensuring SYSTEM """ block is intact.
# elite-coding-system.md must not contain the sequence """ alone on a line.
if grep -q '"""' "${SYSTEM_FILE}"; then
  echo "elite-coding-system.md must not contain triple quotes" >&2
  exit 1
fi

cat > "${OUT}" <<EOF
# ElloFive AI — Elite Coding System (auto-built)
# Source: models/elite-coding-system.md
# Rebuild: bash scripts/build-modelfile.sh && ellofive setup
FROM ${BASE_MODEL}

SYSTEM """
$(cat "${SYSTEM_FILE}")
"""

PARAMETER temperature 0.35
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 16384
PARAMETER repeat_penalty 1.12
PARAMETER num_predict 4096
EOF

echo "Wrote ${OUT} (FROM ${BASE_MODEL})"
