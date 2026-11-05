#!/bin/bash
# Runs LV-FLT-01 (submit a leave, then filter for it). Works from any folder:
#   ./run.sh      or      specs/003-requests/qa-mostafa/run.sh
# Uses the test account and DEVICE in specs/001-activities/maestro/.env.
set -euo pipefail
cd "$(dirname "$0")"
ENV_FILE=../../001-activities/maestro/.env
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (copy .env.example there and fill it in)." >&2; exit 1; }
ENV_ARGS=()
DEVICE=""
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  [[ "$key" == "DEVICE" ]] && { DEVICE="$value"; continue; }
  ENV_ARGS+=(-e "$key=$value")
done < "$ENV_FILE"
DEVICE_ARGS=()
[[ -n "$DEVICE" ]] && DEVICE_ARGS=(--device "$DEVICE")
mkdir -p results
exec maestro "${DEVICE_ARGS[@]+"${DEVICE_ARGS[@]}"}" test "${ENV_ARGS[@]}" "$@" \
  --format junit --output results/report.xml LV-FLT-01-submit-leave-then-filter.yaml
