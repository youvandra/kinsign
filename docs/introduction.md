---
title: Introduction
description: What Kinsign is, who it is for, and how the pieces fit together.
---

# Introduction

Kinsign is a payment safeguard for the moment a customer is being talked into a transfer. When a risky payment happens during a live phone call or a screen share, the bank holds it, and the decision to release it moves to a person the customer trusted before the call began. The customer's own phone keeps every other choice: paying as usual, cancelling, or calling for help.

Kinsign gives three groups one shared mechanism:

- **Customers** pay as usual. Protection appears only when a payment happens under pressure, and it asks nothing of them in the moment.
- **Families and trusted people** decide from their own phones, with the facts the bank has, and they can always call back first.
- **Banks** hold narrowly, share the release record with the operator and the regulator, and improve their risk score with the operator's call signals without either side revealing its data.

## How the pieces fit

| Layer | What it does | Where it lives |
|---|---|---|
| Hold rule | Decides, per transfer, to pay now or hold for the circle | [`packages/core`](https://github.com/youvandra/kinsign/tree/main/packages/core) |
| Release contract | Records the trusted circle, its 72-hour timelock and every decision | [`contracts/src/KinsignRelease.sol`](https://github.com/youvandra/kinsign/blob/main/contracts/src/KinsignRelease.sol) |
| Bank API | Opens holds, issues decision records, settles money by the contract | [`apps/api`](https://github.com/youvandra/kinsign/tree/main/apps/api) |
| SDK | Typed client, device keys and signed decisions for any app | [`packages/sdk`](https://github.com/youvandra/kinsign/tree/main/packages/sdk) |
| Federated score | Bank and operator train one model with FATE, each keeping its data | [`federation`](https://github.com/youvandra/kinsign/tree/main/federation) |

## Where to go next

- [Quickstart](/docs/quickstart): run the bank API, the demo app and a local chain in a few minutes.
- [Holds](/docs/concepts/holds): when a transfer is held, and why.
- [SDK overview](/docs/sdk/overview): integrate Kinsign into a banking or family app.
- [Security model](/docs/security): the guarantees the contract enforces.
