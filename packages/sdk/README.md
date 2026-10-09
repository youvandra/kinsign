# @kinsign/sdk

The client SDK for apps that talk to a Kinsign bank.

| Module | What it is |
|---|---|
| `client.ts` | `createClient`: typed bank API client, `ApiError` |
| `device.ts` | `createDevice`: one person's key, signing contract calls on their own device |
| `signer.ts` | `createSigner`: release, block and cancel with a salted decision record |

```ts
import { createClient, createDevice, createSigner } from '@kinsign/sdk'

const kinsign = createClient({ baseUrl: 'https://bank.example' })
const device = createDevice({ key, config: await kinsign.config(), rpcUrl: 'https://bank.example/rpc' })
await createSigner(kinsign, device).block(hold)
```

Full reference: [`docs/sdk/`](../../docs/sdk).
