# Kinsign · 亲签

**A release layer for payments made under pressure.** Everyday payments go straight through. A risky payment made during a live phone call or screen share waits, and only a person the customer trusted before the call began can release it, from their own phone.

- **Release contract.** The trusted circle, its 72-hour timelock and every decision live in [`KinsignRelease`](contracts/src/KinsignRelease.sol), on a FISCO BCOS chain the bank shares with the mobile operator and the regulator.
- **Federated score.** Bank and operator train one hold score with [FATE](https://github.com/FederatedAI/FATE) (PSI, then hetero SecureBoost), and neither reveals its data to the other.
- **SDK.** [`@kinsign/sdk`](packages/sdk) gives banking and family apps a typed client, device keys and signed decisions.
- **Assistant.** [`@kinsign/agent`](packages/agent) helps with everyday payments in three languages, reads the in-call interview from the customer's own words and writes the family note. It reads and drafts; the customer confirms every payment herself.

Documentation lives in [`docs/`](docs) and is served by the web app at `/docs`.

## Repository

```
kinsign/
├── apps/
│   ├── api/          Bank HTTP API: routes, input validation, RPC proxy for devices
│   └── web/          Site, docs, benchmarks and the two-phone demo (React, Vite, Tailwind, motion)
├── packages/
│   ├── protocol/     Wire types and API paths. Types only
│   ├── core/         Domain: hold policy, ledger, salted records, engine. Pure
│   ├── chain/        KinsignRelease client, anvil and FISCO BCOS networks
│   ├── sdk/          Client SDK: API client, devices, signed decisions
│   └── agent/        Payment assistant, interview reader, family note (Claude or offline)
├── bench/            Scenario corpus, population model, FATE export and evaluation
├── contracts/        KinsignRelease.sol with Foundry unit and invariant tests
├── federation/       FATE 2.2 job: PSI and hetero SecureBoost between bank and operator
├── infra/fisco/      Local four-node FISCO BCOS chain
├── scripts/          setup.sh for a fresh checkout
└── docs/             Documentation, in Markdown
```

**Dependencies point one way.** `protocol` depends on nothing. `core`, `chain`, `sdk` and `agent` depend on `protocol`. `api` combines `core`, `chain` and `agent`; `bench` combines `core` and `chain`. `web` uses `sdk`. `core` reaches the contract only through `ReleaseLedgerPort`, which `chain` implements against the contract and the unit tests implement in memory.

## Guarantees and where they are checked

| Property | Enforced in | Checked by |
|---|---|---|
| The holder never releases their own hold (I1) | contract | Foundry tests and invariants, scenario corpus |
| Circle changes wait 72 hours and can be vetoed (I2) | contract | Foundry tests, scenario corpus |
| The interview only raises risk (I3) | `core/policy.ts`, `api/http/validate.ts` | `core/test/policy.test.ts`, `api/test/validate.test.ts` |
| Nothing is released by time alone (I4) | contract | Foundry tests |
| The record chain matches the disclosed records (I5) | contract, `core/records.ts` | `core/test/records.test.ts`, every scenario |
| Money moves only by the contract's state | `core/engine.ts` | `core/test/engine.test.ts` |
| The bank cannot decide for a device | device keys stay on the device (`sdk/device.ts`) | the API holds only the operator and reviewer keys |

## Quick start

Requirements: Node.js 22+ and [Foundry](https://getfoundry.sh) (`scripts/setup.sh` installs it when missing).

```bash
git clone git@github.com:youvandra/kinsign.git && cd kinsign
scripts/setup.sh

npm run dev:api     # bank API on :8620, with its own local chain
npm run dev:web     # http://localhost:5190
```

Open `/stage` for both phones side by side, `/docs` for the documentation and `/benchmarks` for the measured results. To run on FISCO BCOS, see [`docs/guides/fisco-bcos.md`](docs/guides/fisco-bcos.md).

## Checks

```bash
npm run typecheck        # every workspace
npm run lint             # ESLint
npm run format:check     # Prettier
npm test                 # Vitest
(cd contracts && forge test)
npm run bench:scenarios  # scenario corpus as real transactions
```

CI runs all of them on every push. [`CONTRIBUTING.md`](CONTRIBUTING.md) has the conventions.

## Results

Every published number has a file in [`bench/results/`](bench/results), and the web app's `/benchmarks` page reads those files directly. In short: 162 of 162 scripted cases pass on anvil and on FISCO BCOS with no money reaching a scammer, the population model puts the loss rate at 8.7% against 100% for in-call warnings, and the federated score cuts friction by 83% at matched loss under realistic operator signals and by 7% under weak ones. [`docs/guides/benchmarks.md`](docs/guides/benchmarks.md) explains how to reproduce them.
