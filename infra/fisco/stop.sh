#!/usr/bin/env bash
# Stops the local FISCO BCOS nodes started by setup.sh. Node data is kept.
set -euo pipefail
bash "$(cd "$(dirname "$0")" && pwd)/build/nodes/127.0.0.1/stop_all.sh"
