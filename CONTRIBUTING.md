# Contributing

This repository holds the Kinsign code and its technical documentation. Product strategy and research live elsewhere.

## Set up

```bash
scripts/setup.sh
```

It installs Foundry when it is missing, fetches the `forge-std` submodule, installs npm dependencies and builds the contract. It needs network access to GitHub, npm and foundry.paradigm.xyz. A cloud agent environment can run it as its setup script.

## Before you push

Every change keeps these green, as CI does:

```bash
npm run typecheck
npm run lint
npm run format:check      # npm run format fixes it
npm test
(cd contracts && forge test)
```

Run `npm run bench:scenarios` as well when you touch `packages/core`, `packages/chain`, `apps/api` or the contract: it replays the scenario corpus as real transactions on a local anvil.

## How the code is organised

- **Dependencies point one way:** `protocol` ← `core`, `chain`, `sdk`, `agent` ← `api`, `bench`, `web`. `core` reaches the contract only through `ReleaseLedgerPort`; `agent` reaches a model only through `ModelPort`.
- **Wire types live once,** in `packages/protocol`, and every API path is a constant there.
- **State lives in hooks** in the web app; components render. Derived state is computed during render, without effects that set state.
- **Motion never decides visibility.** Entrances move only transform and run only while the page is visible (`usePageVisible`).
- **Docs are Markdown in `docs/`,** rendered by the web app. A new page goes in `apps/web/src/features/docs/content/navigation.ts`, and `apps/web/test/docs.test.ts` checks the sidebar and the links.
- **Benchmark outputs in `bench/results/` are committed.** Regenerate them only with the scripts, and say so in the commit.

## Rules that protect the design

- The account holder never releases her own hold, and nothing is released by time alone. Changes near `release`, `_requireCircle`, `escalate` or the engine's `sync` need a test that would fail without them.
- Interview answers only add risk. Anything that turns text or a model reply into answers goes through `yesOnly` or `interviewYeses`.
- The assistant reads and drafts. It gets no tool that sends, releases, approves, or changes the trusted circle; `packages/agent/test/assistant.test.ts` checks the tool list.
- Device keys stay on the device. The API holds only the operator and reviewer keys.
- Paid model calls happen only when `KINSIGN_ASSISTANT=claude` is set. Tests use the offline rules or a scripted model.

## Commits

- One commit per real change, with a short imperative subject in lower case: `add the family note`, `fix the draft double send`.
- No trailers or co-author lines.
- English throughout: code, comments, docs and commit messages.
