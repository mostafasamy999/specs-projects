#!/bin/bash
# Runs CRT-FLT-01 (create a task, then filter for it) on the device in
# ../maestro/.env. Works from any folder:  ./run.sh   or   qa-mostafa/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
exec maestro/run.sh ../qa-mostafa/CRT-FLT-01-create-task-then-filter.yaml "$@"
