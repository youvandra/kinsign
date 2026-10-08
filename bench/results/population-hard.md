# Population benchmark

One million customers, one year, yuan. Parameters in bench/src/population/params.ts; most are assumptions. Coached-victim model: resist = 0 unless swept.

Scam value attempted: 33.1 m yuan from 2,000 attempts; 40.0 m legitimate transfers.

## Coached victim, circle not fooled, mid costs

| Baseline | VRR | Loss rate | Prevented loss | Legit held | Held on calls | Value held | Friction cost | Net benefit | Liability avoided (50%) |
|---|---|---|---|---|---|---|---|---|---|
| B0 no protection | 100.0% | 100.0% | 0 | 0.0% | 0.0% | 0.0% | 0 | 0 | 0 |
| B1 in-call warning | 100.0% | 100.0% | 0 | 0.0% | 0.0% | 0.0% | 794,000 | -794,000 | 0 |
| B2 warning + 30 s pause | 100.0% | 100.0% | 0 | 0.0% | 0.0% | 0.0% | 3,100 | -3,100 | 0 |
| B3 guardian notification | 100.0% | 100.0% | 0 | 0.0% | 0.0% | 0.0% | 0 | 0 | 0 |
| B4 money lock | 90.2% | 90.6% | 3.1 m | 0.7% | 0.8% | 3.9% | 28.6 m | -25.5 m | 1.6 m |
| B5 score + self-confirmation | 100.0% | 100.0% | 0 | 0.0% | 0.0% | 0.0% | 126,600 | -126,600 | 0 |
| K Kinsign core | 9.2% | 8.7% | 30.2 m | 1.1% | 27.9% | 2.4% | 11.6 m | 18.6 m | 15.1 m |

Kinsign holds 442,400 legitimate transfers a year; median wait 9 min, p90 182 min. Break-even friction per hold: 68 yuan.

Kinsign loss rate by typology: kin 6.4%, authority 4.2%, refund 3.4%, investment 31.8%, takeover 1.7%

## Loss rate when some coached victims resist warnings

| Resist | B0 no protection | B1 in-call warning | B2 warning + 30 s pause | B3 guardian notification | B4 money lock | B5 score + self-confirmation | K Kinsign core |
|---|---|---|---|---|---|---|---|
| 0.0% | 100.0% | 100.0% | 100.0% | 100.0% | 90.6% | 100.0% | 8.7% |
| 20.0% | 100.0% | 81.4% | 95.9% | 100.0% | 90.6% | 81.1% | 8.7% |
| 40.0% | 100.0% | 62.9% | 91.9% | 100.0% | 90.6% | 62.1% | 8.7% |

## Kinsign: circle fooled × cost level

| Circle fooled | Costs | Loss rate | Friction cost | Net benefit | Break-even per hold |
|---|---|---|---|---|---|
| 0.0% | low | 8.7% | 3.5 m | 26.8 m | 68 |
| 0.0% | mid | 8.7% | 11.6 m | 18.6 m | 68 |
| 0.0% | high | 8.7% | 30.0 m | 189,638 | 68 |
| 5.0% | low | 12.7% | 3.5 m | 25.5 m | 65 |
| 5.0% | mid | 12.7% | 11.6 m | 17.3 m | 65 |
| 5.0% | high | 12.7% | 30.0 m | -1.1 m | 65 |
| 10.0% | low | 16.7% | 3.5 m | 24.1 m | 62 |
| 10.0% | mid | 16.7% | 11.6 m | 16.0 m | 62 |
| 10.0% | high | 16.7% | 30.0 m | -2.4 m | 62 |
| 20.0% | low | 24.6% | 3.5 m | 21.5 m | 56 |
| 20.0% | mid | 24.6% | 11.6 m | 13.4 m | 56 |
| 20.0% | high | 24.6% | 30.0 m | -5.1 m | 56 |

## Loss–friction curve (hold threshold on the rule score)

| θ | Loss rate | Legit held | Friction cost | Net benefit |
|---|---|---|---|---|
| 0 | 8.7% | 1.1% | 11.6 m | 18.6 m |
| 0.3 | 8.7% | 1.1% | 11.6 m | 18.6 m |
| 0.5 | 8.8% | 0.6% | 6.3 m | 23.9 m |
| 0.6 | 9.3% | 0.3% | 3.3 m | 26.7 m |
| 0.7 | 10.7% | 0.2% | 1.6 m | 27.9 m |
| 0.8 | 14.6% | 0.1% | 924,629 | 27.4 m |
| 0.9 | 35.4% | 0.0% | 86,908 | 21.3 m |
| 0.95 | 71.0% | 0.0% | 6,921 | 9.6 m |

## Federated layer (FATE PSI + hetero SecureBoost), operator setting: hard

Scored on 8056 triggered test events on a federated operator (6469 scam, 1587 legitimate), re-weighted to the population. Holding every triggered transfer loses 8.8%.

| Hold score | AUC | Best θ at ≤ +0.5 pp loss | Loss rate | Legit held | Held on calls | Friction cost | Net benefit |
|---|---|---|---|---|---|---|---|
| Rule score (@kinsign/core) | 0.940 | 0.5 | 9.0% | 0.6% | 15.4% | 6.4 m | 23.1 m |
| SecureBoost, bank features only | 0.948 | 0.5 | 9.0% | 0.4% | 9.9% | 4.2 m | 25.3 m |
| SecureBoost, bank + operator (FATE) | 0.969 | 0.4 | 9.2% | 0.4% | 9.3% | 3.9 m | 25.6 m |

Loss–friction curves:

| θ | Rule score (@kinsign/core): loss / held | SecureBoost, bank features only: loss / held | SecureBoost, bank + operator (FATE): loss / held |
|---|---|---|---|
| 0 | 8.8% / 1.1% | 8.8% / 1.1% | 8.8% / 1.1% |
| 0.1 | 8.8% / 1.1% | 8.8% / 0.8% | 8.8% / 0.9% |
| 0.2 | 8.8% / 1.1% | 8.8% / 0.8% | 8.8% / 0.6% |
| 0.3 | 8.8% / 1.1% | 8.8% / 0.7% | 9.0% / 0.4% |
| 0.4 | 8.8% / 0.9% | 8.9% / 0.5% | 9.2% / 0.4% |
| 0.5 | 9.0% / 0.6% | 9.0% / 0.4% | 9.6% / 0.3% |
| 0.6 | 9.5% / 0.3% | 10.1% / 0.3% | 10.2% / 0.2% |
| 0.7 | 10.7% / 0.2% | 11.7% / 0.2% | 12.1% / 0.1% |
| 0.8 | 14.7% / 0.1% | 14.4% / 0.1% | 14.4% / 0.1% |
| 0.85 | 19.9% / 0.0% | 16.3% / 0.1% | 16.5% / 0.1% |
| 0.9 | 33.8% / 0.0% | 25.0% / 0.0% | 22.3% / 0.0% |
| 0.95 | 69.8% / 0.0% | 43.7% / 0.0% | 44.1% / 0.0% |
| 0.97 | 75.1% / 0.0% | 89.0% / 0.0% | 89.5% / 0.0% |
| 0.99 | 85.7% / 0.0% | 100.0% / 0.0% | 100.0% / 0.0% |
