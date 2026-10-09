---
title: Run on FISCO BCOS
description: Start a local four-node FISCO BCOS chain and point Kinsign at it.
---

# Run on FISCO BCOS

The release contract runs unchanged on any EVM chain. In production it runs on FISCO BCOS, operated jointly by the bank, the operator and the regulator. This guide starts a local four-node chain.

## Requirements

- macOS (Apple silicon or Intel) or Linux x86-64
- Java 17 for the FISCO console (`brew install openjdk@17` on macOS)

## Start the chain

```bash
infra/fisco/setup.sh
```

The script downloads FISCO BCOS 3.16.4 and console 3.7.0 into `infra/fisco/build/`, builds four nodes on `127.0.0.1`, enables the web3 JSON-RPC on port 8545 (chain id 20200), and registers the chain's admin account as balance governor.

> [!NOTE]
> The FISCO web3 endpoint refuses senders with zero native balance, even at gas price 0. `fundOnFisco` in `@kinsign/chain` tops accounts up through the console, which is why the admin account is registered as governor.

Stop and start the nodes with `infra/fisco/stop.sh` and `infra/fisco/start.sh`.

## Point Kinsign at it

```bash
KINSIGN_RPC=http://127.0.0.1:8545 npm run dev:api
KINSIGN_RPC=http://127.0.0.1:8545 npm run bench:scenarios
```

The API deploys a fresh `KinsignRelease`, funds the demo accounts and serves the same app. Time cannot be moved on FISCO, so the director hides the "skip 72 hours" control.

| Variable | Meaning |
|---|---|
| `KINSIGN_RPC` | Chain RPC; unset starts a local anvil |
| `KINSIGN_JAVA_HOME` | Java 17 home for the console, default `/opt/homebrew/opt/openjdk@17` |
