---
title: Release record
description: The contract the bank, the operator and the regulator share, and what it stores.
---

# Release record

`KinsignRelease` is a Solidity contract on FISCO BCOS, a consortium chain run jointly by the bank, the mobile operator and the regulator. It holds the parts of the system that no single party should be able to change on its own:

- who is in each customer's trusted circle, and when each member became effective;
- the state of each hold, and who decided it;
- a hash chain of every decision record.

The money itself stays in the bank's ledger. The bank settles a hold by reading the contract's state, so a release exists only when the contract recorded one.

## Decision records

Every decision comes with a record: a small JSON document stating what happened, who acted and why. The bank salts it and stores it off chain; the contract stores only its hash and extends the hold's chain:

```text
recordHash = keccak256(salt ‖ json)
chain      = keccak256(abi.encode(chain, recordHash))
```

Anyone holding the records can recompute the chain and compare it with the contract. A missing, altered or reordered record breaks the match. No personal data reaches the chain.

## Signed on the device

A member's decision is a transaction signed by the member's own key, on the member's phone. The bank issues the record, the device puts the record's hash in its transaction, and the bank files the record by the receipt. The bank never holds a member's key, so it cannot decide for the family.

The [SDK](/docs/sdk/signing) implements this sequence in one call.
