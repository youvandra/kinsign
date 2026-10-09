---
title: Reproduce the benchmarks
description: The scenario corpus and the population model, and how to rerun them.
---

# Reproduce the benchmarks

Two benchmarks measure Kinsign, and both write their outputs to `bench/results/`, which is committed so each published number has a file behind it.

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
