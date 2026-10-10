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

## Permission tiers

Each actor holds exactly the authority its role needs. The tiers are enforced by code paths that do not exist, not by checks that could be skipped: the assistant has no tool that sends, the bank has no key that releases.

| Tier | Actor | Holds | Can | Cannot | Enforced by |
|---|---|---|---|---|---|
| 0 | Assistant (model or offline rules) | Read access to her account, statement and holds | Read, explain, advise, draft a transfer | Send, release, approve, set a budget, change the circle | Its seven tools (`packages/agent/src/tools.ts`), checked by a test that no tool name sends or releases |
| 1 | Customer | Her device key and her session | Confirm a draft, transfer, set a budget, cancel her own hold, propose a member | Release her own hold, add a member in under 72 h, strip the circle quickly | Contract `release`, `proposeMember`, `removeMember`; hold rule in `@kinsign/core` |
| 2 | Circle member | Their own device key | Release or block a hold opened while they were a member, veto a proposal, remove a member at once | Act on a hold opened before they became effective | Contract `_requireCircle`, invariant tests |
| 3 | Bank risk engine | The operator key | Enrol, open a hold, escalate after the response window, attest records | Release, block for a member, skip a timelock | Contract `onlyOperator` functions; no release path for the operator |
| 4 | Bank review desk | The reviewer key | Decide a hold already in review, after a call-back | Decide a hold the circle still has | Contract `reviewDecide` |
| 5 | Operator, regulator | A consortium node | Read the shared record | Change it | FISCO BCOS consensus |

## Known risks

| # | Risk | Status | What limits it |
|---|---|---|---|
| 1 | A circle member is fooled, or colludes, and releases | Residual | The family note shows the call, the payee and her answers, and advises a call-back on a known number. Measured in the population model: net benefit stays positive at low and mid costs up to 20% fooled |
| 2 | An addition nobody vetoes for 72 hours becomes a member | Residual by design | Every member is alerted at once and can veto. One contract test states this risk on purpose |
| 3 | Scams with no live channel, such as investment transfers made after the call ended | Partly closed | The after-call window holds risky payments for 30 minutes after a long call from an unknown number (`core/policy.ts`, tested). Payments days after the last call stay outside the trigger; the population model does not credit the window, so its 31.8% loss for that typology is an upper bound |
| 4 | Splitting a transfer below the trigger, or velocity across transfers | Closed | Everything paid on one channel counts toward a cap of five times her usual payment, and on-channel payments never raise her usual amount (`core/engine.ts`, tested) |
| 5 | A known payee that forwards the money | Accepted | Known payees pass without a hold to keep everyday friction low |
| 6 | Prompt injection through a payee name or memo | Bounded | The worst outcome is a draft, which she still has to confirm under the hold rule. Claude mode has unit tests with a scripted model and has not been exercised against the live model |
| 7 | The demo API has no authentication and serves one fixed customer; `/api/demo/*` can warp time and decide reviews | Demo only | A bank deployment sits behind the bank's own session authentication and ships without the demo routes |
| 8 | Demo device keys are derived from fixed labels and handed out in a URL fragment | Demo only | In a deployment each device generates its own key and only the address is enrolled (`generateKey`) |
| 9 | The federated lift comes from synthetic data | Open | Reported under a strong and a weak operator setting; H3 fails under the weak one. A pilot must measure it |
| 10 | All four FISCO BCOS nodes run on one machine | Demo only | The shared record gives assurance only when parties with different interests run the nodes |
| 11 | Call state comes from a toggle in the web demo | Open | The native iOS app reads `CXCallObserver` and screen capture; it is in progress |
| 12 | Statement, budgets and conversations live in memory | Demo only | Lost on restart; a deployment reads the bank's core ledger |
| 13 | The live score query tells the operator a risky transfer is under way | Mitigation designed | Batched queries with dummy requests, or operator-pushed scores for long calls |
| 14 | Record hashes on chain cover low-entropy values | Closed | Every record is salted; the salt stays with the bank for disclosure |
| 15 | The scammer learns her duress PIN | Closed | The duress PIN only holds and alerts; the real PIN on a call still triggers the hold |

## Limits

- A trusted person who is fooled, or who colludes, can release. The member's screen therefore shows the call signals and the interview answers, and the advice is to call the customer back on a known line first.
- Coercion without a call or screen share, such as a scammer standing in the room, triggers no channel signal. The emergency PIN covers it: entered instead of the normal PIN, it holds the transfer silently.
