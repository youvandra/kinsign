# @kinsign/bench

| Path | What it measures |
|---|---|
| `src/scenarios/` | 75 scam and 24 legitimate scripted cases, played as real transactions against the contract (`corpus.ts`, `steps.ts`, `run.ts`) |
| `src/population/` | Money-weighted model for one million customers: seeded generator, defences, metrics, report |
| `src/fate/` | Export for the FATE job, and the comparison of rule, bank-only and federated scores |
| `results/` | Every output, committed so each published number has a file behind it |

Every population parameter is in `src/population/params.ts`, and most are assumptions. Read the sweeps, not single numbers.
