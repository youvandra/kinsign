---
title: API client
description: createClient, its options, its methods and its errors.
---

# API client

```ts
import { createClient } from '@kinsign/sdk'

const kinsign = createClient({ baseUrl: 'https://bank.example' })
```

## Options

| Option | Type | Default | Meaning |
|---|---|---|---|
| `baseUrl` | `string` | `''` | Origin of the bank API. Empty means the page's own origin. |
| `fetch` | `typeof fetch` | global `fetch` | A fetch implementation, for tests or custom transports. |

## Reading state

| Method | Returns |
|---|---|
| `config()` | `ConfigView`: chain id, contract address and ABI, the holder and the members |
| `account()` | `AccountView`: balance, reserved amount, known payees and recent payments |
| `holds()` | `HoldView[]`: every hold with its state, signals, reasons and records |
| `proposals()` | `ProposalsView`: pending, vetoed and effective circle proposals |
| `blockNumber()` | The chain's current block, read through the API's RPC proxy |

## Making a transfer

```ts
const result = await kinsign.transfer({
  payee: 'Electricity Co.',
  amount: 320,
  channel: { onCall: false, callSeconds: 0, callerSaved: false, screenCaptured: false, remoteControlApp: false },
})
// { action: 'pay', holdId: null, reasons: [], score: 0.07 }
```

`channel` is what the phone reports at the moment of sending. On iOS, `CXCallObserver` gives the call and `UIScreen.isCaptured` the screen capture; the caller's number stays private to the phone, so only `callerSaved` (a contact-list match) is reported.

## Answering the interview

```ts
await kinsign.interview(holdId, { toldToKeepSecret: true })
```

Send only the answers that are "yes". The bank ignores everything else, because an answer can raise risk and never lower it.

## The assistant

```ts
const view = await kinsign.assistant.chat('pay 260 to State Grid electricity')
const draft = view.drafts[0]

// The customer's tap. The draft goes through the hold rule with the phone's call state.
const { result } = await kinsign.assistant.confirm(view.conversationId, draft.id, channel)
```

`kinsign.interviewText(holdId, text)` sends the customer's own words during a hold, and `kinsign.holdSummary(holdId, lang)` returns the family note. See [Payment assistant](/docs/concepts/assistant).

## Budgets, bills and insights

```ts
const money = await kinsign.finance.view('en')
money.insights[0] // { kind: 'duplicateCharge', severity: 'act', title: 'China Mobile charged you twice', … }

// The customer's tap on a suggested budget.
await kinsign.finance.setBudget('groceries', 1_600, 'en')
```

## Errors

A response with an error status throws `ApiError`, with the server's reason as `message` and the HTTP status as `status`:

```ts
import { ApiError } from '@kinsign/sdk'

try {
  await kinsign.sync(holdId)
} catch (e) {
  if (e instanceof ApiError) showError(e.message) // e.g. 400 "unknown hold 0x…"
}
```

## Demo endpoints

`kinsign.demo` exposes the local demo server's extras: `links()`, `escalate(holdId)`, `review(holdId, approve)` and `warp(hours)`. A production bank leaves them out.
