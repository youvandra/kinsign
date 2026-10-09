---
title: HTTP API
description: Every endpoint of the bank API, with its request and response.
---

# HTTP API

The bank API speaks JSON over HTTP. Paths are defined once in `@kinsign/protocol` as `API`, and the SDK's [client](/docs/sdk/client) wraps every endpoint. Errors return a status code and `{ "error": "<reason>" }`.

## Reading state

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/config` | `ConfigView` |
| `GET` | `/api/account` | `AccountView` |
| `GET` | `/api/holds` | `HoldView[]` |
| `GET` | `/api/proposals` | `ProposalsView` |

## Transfers and holds

### `POST /api/transfer`

```json
{
  "payee": "Zhang Wei",
  "amount": 50000,
  "channel": { "onCall": true, "callSeconds": 2400, "callerSaved": false, "screenCaptured": false, "remoteControlApp": false },
  "duress": false
}
```

Returns `TransferResult`: `{ "action": "pay" | "hold", "holdId": "0x…" | null, "reasons": [...], "score": 0.93 }`. `amount` is between 1 and 10,000,000.

### `POST /api/interview`

`{ "holdId": "0x…", "answers": { "toldToKeepSecret": true } }`. Only `true` answers are kept and attested on chain.

### `POST /api/record`

`{ "holdId": "0x…", "kind": "release" | "block" | "cancel", "by": "0x…" }`. Issues a salted decision record and returns `{ "recordHash": "0x…" }`.

### `POST /api/holds/sync`

`{ "holdId": "0x…", "recordHash": "0x…", "txHash": "0x…" }`. Files the record by the transaction's receipt (a refused transaction files it as refused) and settles the money by the contract. Returns `{ "state": "Released" }`.

## Chain access

### `POST /rpc`

A JSON-RPC proxy to the chain, so devices can sign against the same origin. It forwards only the methods a device needs: reads, gas estimates, `eth_sendRawTransaction` and receipts. Anything else returns JSON-RPC error `-32601`.

## Demo endpoints

The local demo server adds `GET /api/demo/links`, `POST /api/demo/escalate`, `POST /api/demo/review` and `POST /api/demo/warp` (anvil only) for the director panel.
