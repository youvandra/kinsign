---
title: Signed decisions
description: Release, block or cancel a hold with one call, record included.
---

# Signed decisions

```ts
import { createSigner } from '@kinsign/sdk'

const signer = createSigner(kinsign, device)
```

## Methods

| Method | Who may call it | Contract function | Result state |
|---|---|---|---|
| `release(hold)` | A member of the circle | `release` | `Released` |
| `block(hold)` | A member of the circle | `blockHold` | `Blocked` |
| `cancel(hold)` | The account holder | `cancel` | `Cancelled` |
| `proposeMember(member)` | The account holder | `proposeMember` | effective in 72 hours |
| `vetoMember(holder, member)` | A member of the circle | `vetoMember` | proposal vetoed |

`hold` is any object with `holdId` and `transferDigest`, such as a `HoldView` from `client.holds()`.

## What happens in one call

```text
Device                      Bank API                     KinsignRelease
  │  issueRecord(hold, kind)  │                               │
  │ ────────────────────────▶ │                               │
  │ ◀──────────── recordHash  │                               │
  │  release(holdId, digest, recordHash) ───────────────────▶ │
  │ ◀──────────────────────────────────────────── receipt     │
  │  sync(hold, recordHash, txHash)                           │
  │ ────────────────────────▶ │                               │
  │ ◀───────────────── state  │                               │
```

1. The bank issues a salted decision record and returns its hash.
2. The device signs the contract call with that hash, so the record is bound to this exact transaction.
3. The bank files the record by the receipt and settles the money by the contract's state.

## Results

```ts
const r = await signer.release(hold)
if (!r.ok) {
  // r.error is the contract's reason: 'NotMember', 'BadState', 'DigestMismatch' …
}
```

`DecisionResult` carries `ok`, `error`, the transaction `hash` and the hold's `state` after the bank synced it.
