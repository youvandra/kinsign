---
title: Holds
description: When Kinsign holds a transfer, what the customer sees, and how a hold ends.
---

# Holds

A hold reserves the money of one transfer until someone outside the call decides. The customer's balance shows it as reserved, and the payee receives nothing until the hold is released.

## When a transfer is held

The hold rule in `@kinsign/core` holds a transfer when two things are true at the moment it is sent:

1. **A coercion channel is live.** The phone reports an active call, screen capture, or a remote-control app. The channel also stays open for **30 minutes after a call of 5 minutes or more from a number outside her contacts**, because a coached customer is often told to hang up first and pay straight after.
2. **The transfer carries a risky feature.** The payee is new, the amount is above three times the customer's usual payment, the payee account is flagged, or **everything she has paid on this channel, this transfer included, passes five times her usual payment**, so many small payments to known payees cannot add up unnoticed.

Everything else is paid at once. A large payment to a known payee with no call in progress goes straight through, and so does a small payment during a call.

Payments made while a channel is open never enter her usual amount. A caller cannot raise the bar by having her make a few payments first.

```ts
import { CORE_POLICY, decide } from '@kinsign/core'

const decision = decide(customer, request, flaggedPayees, CORE_POLICY)
// { action: 'hold', score: 0.93, reasons: ['on a call for 14 min', 'new payee', 'amount 40.0x the usual'] }
```

| Setting | `CORE_POLICY` | Meaning |
|---|---|---|
| `normMultiple` | 3 | A single transfer above this multiple of her usual payment is unusual |
| `afterCallSeconds` | 1,800 | How long the channel stays open after a call |
| `afterCallMinSeconds` | 300 | Shorter calls do not open the after-call window |
| `channelCapMultiple` | 5 | What she may pay on one channel, as a multiple of her usual payment |
| `holdThreshold` | 0 | Score at or above which a triggered transfer is held |

## The score

Each triggered transfer gets a score in `[0, 1]` with the reasons behind it. The bank chooses a threshold: `holdThreshold: 0` holds every triggered transfer, and a higher threshold holds only the riskier ones. When the operator joins through [federation](/docs/concepts/risk-score), the federated model replaces the hand-written score.

## The in-call interview

While a transfer is held, the customer's phone asks three short questions: whether someone on the call asked for this payment, whether they were told to keep it secret, and whether they were promised money or threatened. Each "yes" raises the score and adds a reason the trusted person can read. A "no" leaves everything as it was, so a coached answer can never unlock a hold.

## How a hold ends

| Outcome | Who | Contract call |
|---|---|---|
| **Released** to the payee | A trusted person in the circle | `release` |
| **Blocked**, money returns | A trusted person in the circle | `blockHold` |
| **Cancelled**, money returns | The customer | `cancel` |
| **Review** at the bank | The bank, after the response window passes | `escalate`, then `reviewDecide` |

A hold never releases because time passed. If nobody in the circle answers within the response window, it goes to a person at the bank, who calls the customer back.
