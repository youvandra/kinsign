#!/usr/bin/env bash
# Builds and starts a local four-node FISCO BCOS 3.x chain for Kinsign:
# web3 JSON-RPC on 127.0.0.1:8545 (chain id 20200), and the console with the
# chain's admin account registered as balance governor, so `fundOnFisco` can
# top up senders (the web3 endpoint refuses zero-balance senders).
#
# Needs: curl, openssl, Java 17 (for the console). Everything lands in build/.
set -euo pipefail

FISCO_VERSION="${FISCO_VERSION:-v3.16.4}"
CONSOLE_VERSION="${CONSOLE_VERSION:-v3.7.0}"
P2P_PORT="${P2P_PORT:-30300}"
RPC_PORT="${RPC_PORT:-20200}"
WEB3_PORT="${WEB3_PORT:-8545}"

HERE="$(cd "$(dirname "$0")" && pwd)"
BUILD="$HERE/build"
mkdir -p "$BUILD"
cd "$BUILD"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) PKG=fisco-bcos-macOS-arm.tar.gz ;;
  Darwin-x86_64) PKG=fisco-bcos-macOS-x86_64.tar.gz ;;
  Linux-x86_64) PKG=fisco-bcos-linux-x86_64.tar.gz ;;
  *) echo "unsupported platform: $(uname -sm)" >&2; exit 1 ;;
esac

fetch() { [ -f "$2" ] || curl -fsSL --retry 3 -o "$2" "$1"; }

fetch "https://raw.githubusercontent.com/FISCO-BCOS/FISCO-BCOS/$FISCO_VERSION/tools/BcosAirBuilder/build_chain.sh" build_chain.sh
fetch "https://github.com/FISCO-BCOS/FISCO-BCOS/releases/download/$FISCO_VERSION/$PKG" "$PKG"
fetch "https://github.com/FISCO-BCOS/console/releases/download/$CONSOLE_VERSION/console.tar.gz" console.tar.gz
[ -x fisco-bcos ] || tar xzf "$PKG"
[ -d console ] || tar xzf console.tar.gz

if [ ! -d nodes ]; then
  bash build_chain.sh -l 127.0.0.1:4 -p "$P2P_PORT,$RPC_PORT" -e ./fisco-bcos -o nodes
  # Web3 JSON-RPC on node0 only, and every listener on loopback.
  for n in nodes/127.0.0.1/node*; do
    sed -i.bak -e "s/listen_ip=0.0.0.0/listen_ip=127.0.0.1/" "$n/config.ini" && rm "$n/config.ini.bak"
  done
  sed -i.bak -e "/\[web3_rpc\]/,/listen_port/{s/enable=false/enable=true/;s/listen_port=.*/listen_port=$WEB3_PORT/;}" nodes/127.0.0.1/node0/config.ini
  rm nodes/127.0.0.1/node0/config.ini.bak
fi

# Console: the SDK certificates and the admin account the chain was built with.
cp -n console/conf/config-example.toml console/conf/config.toml 2>/dev/null || true
cp -r nodes/127.0.0.1/sdk/* console/conf/
mkdir -p console/account/ecdsa
cp nodes/ca/accounts/*.pem console/account/ecdsa/
ADMIN="$(basename "$(ls nodes/ca/accounts/0x*.pem | grep -v pub | head -1)" .pem)"
sed -i.bak -e "s/^#* *accountAddress *=.*/accountAddress = \"$ADMIN\"/" console/conf/config.toml && rm console/conf/config.toml.bak

bash nodes/127.0.0.1/start_all.sh
sleep 8

# Native balances: on, with the admin as the governor that may add balance.
cd console
bash console.sh setSystemConfigByKey feature_balance 1 || true
bash console.sh setSystemConfigByKey feature_balance_precompiled 1 || true
bash console.sh registerBalanceGovernor "$ADMIN" || true

echo
echo "FISCO BCOS is up. Web3 RPC: http://127.0.0.1:$WEB3_PORT (chain id 20200)"
echo "Use it with: KINSIGN_RPC=http://127.0.0.1:$WEB3_PORT npm run dev:api"
