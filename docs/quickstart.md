---
title: Quickstart
description: Run the bank API, the demo app and a local chain on your machine.
---

# Quickstart

This guide runs the whole system locally: a chain with the release contract, the bank API and the web app with two phones.

## Requirements

- Node.js 22 or newer
- [Foundry](https://getfoundry.sh) (`forge` and `anvil`)

## 1. Install

```bash
git clone --recurse-submodules git@github.com:youvandra/kinsign.git
cd kinsign
npm install
```

## 2. Build the contract

```bash
cd contracts && forge build && forge test && cd ..
```

The API reads the compiled artifact from `contracts/out/`, so build before you start it.

## 3. Start the bank API

```bash
npm run dev:api
```

With no `KINSIGN_RPC` set, the API starts its own anvil on port 8548, deploys `KinsignRelease`, enrols a demo customer with one trusted person and listens on `http://localhost:8620`.

> [!TIP]
> To run against FISCO BCOS instead, start a local chain with the [FISCO BCOS guide](/docs/guides/fisco-bcos) and set `KINSIGN_RPC=http://127.0.0.1:8545`.

## 4. Start the web app

```bash
npm run dev:web
```

Open `http://localhost:5190/stage`. The stage shows Mum's phone and her son's phone side by side, with a director panel that plays scripted calls.

## 5. Play a scam call

1. In the director, pick the **“Police”: safe account** scenario. Mum's phone starts a 40-minute call and fills in a ¥50,000 transfer.
2. Press **Send** on her phone. The transfer is held.
3. Press **Release it myself**. The contract refuses with `NotMember`.
4. On her son's phone, press **Block this transfer**. The money returns to her account and both phones show the result.

## Checks

```bash
npm run typecheck   # every workspace
npm run lint        # ESLint
npm test            # unit tests
npm run bench:scenarios   # the scenario corpus, as real transactions
```
