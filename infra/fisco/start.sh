#!/usr/bin/env bash
# Starts the local FISCO BCOS nodes again after stop.sh.
set -euo pipefail
bash "$(cd "$(dirname "$0")" && pwd)/build/nodes/127.0.0.1/start_all.sh"
