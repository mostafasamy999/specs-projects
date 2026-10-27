#!/bin/bash
# Runs Maestro flows with the values from .env.
#   ./run.sh                          every flow
#   ./run.sh flows/list/LST-06.yaml   one flow
#   ./run.sh --include-tags=smoke     only the smoke suite
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || { echo "Missing .env: copy .env.example to .env and fill it in." >&2; exit 1; }
ENV_ARGS=()
DEVICE=""
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  [[ "$key" == "DEVICE" ]] && { DEVICE="$value"; continue; }
  ENV_ARGS+=(-e "$key=$value")
done < .env
DEVICE_ARGS=()
[[ -n "$DEVICE" ]] && DEVICE_ARGS=(--device "$DEVICE")
TARGET="."
ARGS=()
for a in "$@"; do
  if [[ "$a" == -* ]]; then ARGS+=("$a"); else TARGET="$a"; fi
done
mkdir -p results
exec maestro "${DEVICE_ARGS[@]+"${DEVICE_ARGS[@]}"}" test "${ENV_ARGS[@]}" "${ARGS[@]+"${ARGS[@]}"}" \
  --format junit --output results/report.xml "$TARGET"
