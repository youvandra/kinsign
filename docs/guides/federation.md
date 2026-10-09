---
title: Train the federated score
description: Run the FATE job between a bank party and an operator party on one machine.
---

# Train the federated score

The job in `federation/federated.py` runs both parties on one machine with FATE's multiprocess launcher. No FATE-Flow, Eggroll or Docker is needed.

## Set up FATE

```bash
cd federation
uv venv --python 3.10 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

## Export the training data

```bash
npm run bench:fate-export
```

This writes the bank's and the operator's CSVs for both operator settings to `federation/data/`. Each party's file holds only its own columns, joined by an event id.

## Train

```bash
cd federation
KINSIGN_OPERATOR=base .venv/bin/python federated.py --parties guest:9999 host:10000 --log_level WARNING
KINSIGN_OPERATOR=hard .venv/bin/python federated.py --parties guest:9999 host:10000 --log_level WARNING
```

Each run takes about 70 seconds: PSI on train and test, then two SecureBoost models (bank only, and federated). Predictions land in `federation/out/<setting>/`.

## Compare

```bash
npm run bench:population
```

The population benchmark reads the predictions and compares the rule score, the bank-only model and the federated model at the same loss rate. Results are written to `bench/results/population-<setting>.{json,md}` and shown on the [Benchmarks](/benchmarks) page.
