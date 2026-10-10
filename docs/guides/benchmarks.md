---
title: Reproduce the benchmarks
description: The scenario corpus and the population model, and how to rerun them.
---

# Reproduce the benchmarks

Two benchmarks measure Kinsign, and a sandbox run records one full session. All three write their outputs to `bench/results/`, which is committed so each published number has a file behind it.

## Scenario corpus

```bash
npm run bench:scenarios                                       # local anvil
KINSIGN_RPC=http://127.0.0.1:8545 npm run bench:scenarios     # FISCO BCOS
```

Scripted cases, scams and legitimate payments in Chinese, English and Indonesian, run as real transactions against a freshly deployed contract. Each case checks the final state and the money: a scam passes only when nothing reached the payee and every attempt by the victim to release was refused on chain.

## Population model

```bash
npm run bench:population
```

A money-weighted model of one million customers over one year. Every defence runs on the same draws from a seeded generator, so the comparison is exact. It reports:

| Metric | Meaning |
|---|---|
| Loss rate (LR) | Share of attempted scam value that reached scammers |
| Prevented loss | Scam value kept, in yuan |
| False hold rate (FHR) | Share of legitimate transfers held |
| Friction cost | Value of customers' time and abandoned payments from holds |
| Net benefit | Prevented loss minus friction cost |
| Break-even friction | Friction per hold at which net benefit reaches zero |

Every parameter lives in `bench/src/population/params.ts`. Most are assumptions, so the sweeps over victim resistance, circle reliability and cost levels are part of the result.

## Sandbox operation log

```bash
npm run dev:api                                                # in one terminal
npm run bench:sandbox                                          # writes sandbox-anvil.{jsonl,md}

KINSIGN_RPC=http://127.0.0.1:8545 PORT=8621 npm run dev:api     # FISCO BCOS
KINSIGN_API=http://localhost:8621 npm run bench:sandbox         # writes sandbox-fisco.{jsonl,md}
```

Drives a running bank API through `@kinsign/sdk`, the way the two phones do: the monthly summary and tips, a budget the customer sets, a bill paid through the assistant, a second tap on Confirm, a coached request on a scam call, the customer's own transfer held, her attempt to release it refused on chain, her son's block, and a rent payment on a call that her son releases. Every step is logged with its answer and, for decisions, the transaction hash.

## Live assistant run

```bash
npm run eval:assistant -w @kinsign/api      # billed: calls a live model
```

Nineteen cases in Chinese, English and Indonesian: spending, bills and advice, payments, scam requests, prompt injection, the interview reader and the family note. Every check is code, never the model: which drafts exist, which tools ran, and whether the reply warns, stays in the customer's language, and claims no action the assistant cannot take. The run writes `bench/results/assistant-live.{json,md}` with the model, every reply and the token count.

