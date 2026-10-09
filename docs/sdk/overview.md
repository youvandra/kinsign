---
title: SDK overview
description: Install @kinsign/sdk and connect an app to a Kinsign bank API.
---

# SDK overview

`@kinsign/sdk` is the TypeScript SDK for apps that talk to a Kinsign bank: the customer's banking app, a trusted person's app, or a back-office tool. It has three parts.

| Part | Use it to |
|---|---|
| [`createClient`](/docs/sdk/client) | Call the bank API with typed requests and responses |
| [`createDevice`](/docs/sdk/devices) | Hold a person's key on their own device and send contract calls |
| [`createSigner`](/docs/sdk/signing) | Release, block or cancel a hold with a signed decision record |

The SDK runs in browsers, React Native and Node.js 22+. It depends on [`viem`](https://viem.sh) for signing and on `@kinsign/protocol` for the wire types.

## Install

Inside this monorepo, add it as a workspace dependency:

```json
{
  "dependencies": {
    "@kinsign/sdk": "*"
  }
}
```

## A first call

```ts
import { createClient } from '@kinsign/sdk'

const kinsign = createClient({ baseUrl: 'https://bank.example' })

const result = await kinsign.transfer({
  payee: 'Zhang Wei',
  amount: 50_000,
  channel: { onCall: true, callSeconds: 2400, callerSaved: false, screenCaptured: false, remoteControlApp: false },
})

if (result.action === 'hold') {
  console.log('Held for the circle:', result.holdId, result.reasons)
}
```

## A decision from a trusted person's phone

```ts
import { createClient, createDevice, createSigner } from '@kinsign/sdk'

const kinsign = createClient({ baseUrl: 'https://bank.example' })
const config = await kinsign.config()
const device = createDevice({ key: storedKey, config, rpcUrl: 'https://bank.example/rpc' })
const signer = createSigner(kinsign, device)

const [hold] = await kinsign.holds()
const outcome = await signer.block(hold)
// { ok: true, hash: '0x…', state: 'Blocked' }
```

The key never leaves the device. The bank sees the signed transaction and the contract decides whether this person may act.
