#!/usr/bin/env bash
# Prepares a fresh checkout for development, CI or a cloud agent session:
# Foundry, the forge-std submodule, npm dependencies and the contract build.
# Safe to run again; each step skips what is already in place.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v forge >/dev/null 2>&1; then
  echo "· installing Foundry"
  curl -fsSL https://foundry.paradigm.xyz | bash
  export PATH="$HOME/.foundry/bin:$PATH"
  foundryup
fi

echo "· submodules"
git submodule update --init --recursive

echo "· npm dependencies"
if [ -d node_modules ] && [ node_modules/.package-lock.json -nt package-lock.json ]; then
  echo "  up to date"
else
  npm ci
fi

echo "· contracts"
(cd contracts && forge build)

echo
echo "Ready. Run the checks with:"
echo "  npm run typecheck && npm run lint && npm run format:check && npm test && (cd contracts && forge test)"
