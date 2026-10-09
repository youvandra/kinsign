---
title: Federated risk score
description: How the bank and the mobile operator train one model while each keeps its own data.
---

# Federated risk score

The bank knows the payment. The mobile operator knows the call: how old the calling number is, whether it is international, how many other customers it has called today, and whether it has been reported. Together they separate scams from legitimate payments far better than either alone, and neither may hand its data to the other.

Kinsign trains the hold score with [FATE](https://github.com/FederatedAI/FATE), the federated learning framework, in two steps.

## 1. Private set intersection

ECDH PSI on curve25519 aligns both parties on the events they share, keyed by the customer's number and the minute. Each side learns only the shared rows.

## 2. Hetero SecureBoost

Gradient-boosted trees are trained across both parties. The bank holds the label and its features; the operator holds its features and finds its best splits over Paillier-encrypted gradients. The bank never sees the operator's values, and the operator never sees the labels.

The same job also trains a bank-only model, so the gain from federation is measured on identical events. See [Benchmarks](/benchmarks) for the numbers and the [federation guide](/docs/guides/federation) to run it.

## Where the score is used

The score decides which triggered transfers are held. A better score holds fewer legitimate payments at the same protection. The release rule itself never depends on the score: once a transfer is held, only the circle can release it.
