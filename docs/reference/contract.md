---
title: Release contract
description: KinsignRelease functions, events and errors.
---

# Release contract

`KinsignRelease` is written in Solidity 0.8.24 for the `paris` EVM target, because FISCO BCOS 3.x predates `PUSH0`. Source: [`contracts/src/KinsignRelease.sol`](https://github.com/youvandra/kinsign/blob/main/contracts/src/KinsignRelease.sol).

## Roles

| Role | Set | May |
|---|---|---|
| Operator | at deployment | enrol customers, open, escalate and attest holds |
| Reviewer | at deployment | decide holds in `Review` |
| Holder | at enrolment | propose members, remove members (timelocked), cancel own holds |
| Member | at enrolment, or 72 h after a proposal | release, block, veto proposals, remove other members |

## Hold states

`None → Held → Released | Blocked | Cancelled | Review`, and `Review → Released | Blocked | Cancelled`.

## Functions

### Circle

| Function | Caller | Effect |
|---|---|---|
| `enroll(holder, members[])` | operator | Records the circle, effective at once |
| `proposeMember(member)` | holder | Adds `member`, effective after `TIMELOCK` (72 h) |
| `vetoMember(holder, member)` | member | Cancels a pending proposal |
| `removeMember(holder, member)` | holder or member | Removal; the holder's own removals wait for `TIMELOCK` |
| `isMember(holder, who, t)` | anyone | Whether `who` is effective at time `t` |

### Holds

| Function | Caller | From | To |
|---|---|---|---|
| `openHold(holdId, holder, transferDigest, recordHash)` | operator | `None` | `Held` |
| `release(holdId, transferDigest, recordHash)` | member | `Held` | `Released` |
| `blockHold(holdId, recordHash)` | member | `Held`, `Review` | `Blocked` |
| `cancel(holdId, recordHash)` | holder | `Held`, `Review` | `Cancelled` |
| `escalate(holdId, recordHash)` | operator, after `responseWindow` | `Held` | `Review` |
| `reviewDecide(holdId, approve, transferDigest, recordHash)` | reviewer | `Review` | `Released`, `Blocked` |
| `attest(holdId, recordHash)` | operator | live hold | same state, record appended |

`transferDigest` binds payee, amount and transfer id. A release with any other digest reverts with `DigestMismatch`.

## Events

```solidity
event Enrolled(address indexed holder, address[] members);
event MemberProposed(address indexed holder, address indexed member, uint64 effectiveAt);
event MemberVetoed(address indexed holder, address indexed member, address by);
event MemberRemoved(address indexed holder, address indexed member, address by, uint64 removedAt);
event Decision(bytes32 indexed holdId, State state, address indexed by, bytes32 recordHash, bytes32 chain);
```

## Errors

| Error | Meaning |
|---|---|
| `NotMember` | The caller is outside the circle, or is the holder |
| `NotHolder` | Only the holder may cancel |
| `NotOperator`, `NotReviewer` | Role check failed |
| `NotEnrolled`, `AlreadyEnrolled` | Enrolment state |
| `SelfMember`, `AlreadyMember` | Invalid circle change |
| `BadState` | The hold or proposal is in the wrong state |
| `HoldExists` | `holdId` already used |
| `DigestMismatch` | The transfer differs from the one held |
| `WindowOpen` | Escalation before the response window ended |
