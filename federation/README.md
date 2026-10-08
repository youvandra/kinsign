# Federation

The federated coercion score, trained with [FATE 2.2](https://github.com/FederatedAI/FATE) between two parties that never share their data:

- **the bank** (guest) holds the label and the features of the payment;
- **the mobile operator** (host) holds the features of the call in progress.

`federated.py` runs three steps:

1. **ECDH PSI** on curve25519 aligns both sides on an event id they can each compute (the customer's number and the minute). Neither side learns the other's non-matching rows.
2. **Hetero SecureBoost** is trained twice with the same code: bank features only (`complete_secure = num_trees`), then federated, where the operator finds splits over Paillier-encrypted gradients.
3. Both models score the test events and the bank writes `out/<setting>/pred_*.csv`.

## Run it

```bash
cd federation
uv venv --python 3.10 .venv && uv pip install --python .venv/bin/python -r requirements.txt
npm run bench:fate-export            # from the repo root: writes data/<setting>/*.csv
KINSIGN_OPERATOR=base .venv/bin/python federated.py --parties guest:9999 host:10000 --log_level WARNING
```

The multiprocess launcher runs both parties on one machine, so development needs no FATE-Flow, Eggroll or Docker. A run takes about 70 seconds.

| Variable | Default | Meaning |
|---|---|---|
| `KINSIGN_OPERATOR` | `base` | Operator setting: `base` (realistic signals) or `hard` (weak signals) |
| `KINSIGN_TREES` | `5` | Trees per model |
| `KINSIGN_DEPTH` | `3` | Tree depth |
| `KINSIGN_LIMIT` | `0` | Rows per split for a quick run; `0` uses all |

`data/` is generated and gitignored. `out/` is committed, because `npm run bench:population` reads it to compare the rule score, the bank-only model and the federated model.
