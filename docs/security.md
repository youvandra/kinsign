---
title: Security model
description: The invariants the release contract enforces, and what they protect against.
---

# Security model

Kinsign assumes the caller controls the customer completely for the length of the call: what she types, what she answers and what she taps. The design keeps the money safe under that assumption by moving the one decisive step, the release, to someone the caller does not control.

## Invariants

| | Invariant | Enforced by |
|---|---|---|
| **I1** | A held transfer is released only by a circle member who was effective when the hold opened and still is, or by the bank's reviewer after the hold went to review. Never by the holder. | `release`, `_requireCircle` |
| **I2** | A member added after enrolment becomes effective only 72 hours after the proposal, and any effective member can veto it first. The holder's own removals are timelocked too. | `proposeMember`, `vetoMember`, `removeMember` |
| **I3** | The in-call interview can only raise risk. | The hold rule in `@kinsign/core` |
| **I4** | No hold is released by time passing alone. A silent circle sends the hold to human review. | `escalate`, `reviewDecide` |
| **I5** | Every transition extends a per-hold hash chain that nobody can rewrite. | `_move`, `attest` |

The contract's test suite checks I1, I2 and I5 with unit tests and with invariant tests that drive thousands of random call sequences; the coached holder never releases.

## What each party can do alone

| Party | Can | Cannot |
|---|---|---|
| Customer, coached | Pay known payees, cancel, propose a new member | Release a hold, add a member in less than 72 h, strip the circle |
| Caller | Talk, coach, pressure | Reach a member's device or key |
| Bank | Hold, escalate, review after the window | Release while the circle has the hold, or sign for a member |
| Operator, regulator | Read the shared record | Change it |

## Limits

- A trusted person who is fooled, or who colludes, can release. The member's screen therefore shows the call signals and the interview answers, and the advice is to call the customer back on a known line first.
- Coercion without a call or screen share, such as a scammer standing in the room, triggers no channel signal. The emergency PIN covers it: entered instead of the normal PIN, it holds the transfer silently.
