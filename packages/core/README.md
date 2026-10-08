# @kinsign/core

The domain, with no chain client inside.

| File | What it is |
|---|---|
| `policy.ts` | The hold rule: trigger, rule score, interview ratchet (I3) |
| `ledger.ts` | Mock core ledger: pay, reserve, settle, refund, audit |
| `records.ts` | Salted decision records and the hash chain, folded exactly as the contract folds it |
| `engine.ts` | Policy + ledger + `ReleaseLedgerPort`; settles only by the contract's state |

Tests in `test/` run the engine against an in-memory port (`test/fixtures.ts`).
