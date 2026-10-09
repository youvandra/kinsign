---
title: Devices and keys
description: Keep each person's key on their own phone and send contract calls from it.
---

# Devices and keys

A device is one person's key, used on their own phone. Customers and trusted people each have one. The bank never holds them.

```ts
import { createDevice, generateKey } from '@kinsign/sdk'

const key = loadFromSecureStorage() ?? generateKey()
const device = createDevice({
  key,
  config: await kinsign.config(),
  rpcUrl: 'https://bank.example/rpc',
})

device.address // 0x…, registered in the circle at enrolment
```

## Options

| Option | Type | Meaning |
|---|---|---|
| `key` | `Hex` | The private key, from secure storage on the device |
| `config` | `ConfigView` | Chain id, contract address and ABI, from `client.config()` |
| `rpcUrl` | `string` | JSON-RPC endpoint, usually the bank API's `/rpc` proxy |
| `gasLimit` | `bigint` | Optional, defaults to `400000` |

## Storing keys

Use the platform's secure storage: the iOS Keychain, Android Keystore, or, in a browser, a non-exportable key where available. The demo app keeps keys in the browser and hands them over in the link's `#fragment`, which browsers never send to a server.

## Sending calls

`device.send(functionName, args)` simulates the call first to learn the contract's reason, then sends it either way:

```ts
const r = await device.send('vetoMember', [holder, member])
// { ok: false, error: 'NotMember', hash: '0x…' }
```

A refused call still lands on chain as a failed transaction, so every attempt, including a coached customer's attempt to release their own hold, leaves a trace.

For hold decisions, use [`createSigner`](/docs/sdk/signing), which adds the decision record.
