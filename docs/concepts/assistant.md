---
title: Payment assistant
description: The assistant that helps with everyday payments, reads the in-call interview and writes the family note.
---

# Payment assistant

Kinsign's assistant lives in the banking app. The customer asks in her own words, in Chinese, English or Indonesian: "pay the electricity bill", "how much do I have", "send 500 to Wei". The assistant looks things up and prepares the transfer. The customer confirms it on her own screen.

It does three jobs:

| Job | Where | What it produces |
|---|---|---|
| Everyday payments | The customer's phone | A reply and transfer drafts |
| The in-call interview | The pause screen of a hold | "Yes" answers, attested on chain |
| The family note | The trusted person's phone | A short summary in the reader's language |

## What the assistant can do

The assistant has four tools: `get_account`, `recent_payments`, `paused_payments` and `draft_transfer`. Every one of them reads or drafts. Sending, releasing, approving and changing the trusted circle belong to people, and the assistant has no tool for any of them.

A draft becomes a transfer only when the customer presses **Confirm**. That tap sends it through the same hold rule as any other payment, with the phone's call state at that moment, so a payment the assistant drafted during a scam call is held like one she typed herself.

```text
customer: pay 30000 to Wang Lei for his tuition      (on a 25-minute call)
assistant: I prepared ¥30,000 to Wang Lei. Press Confirm when it looks right.
customer taps Confirm  →  hold opened: on a call for 25 min, new payee, 37.5× the usual
```

When the customer says a caller is telling her to pay, to move money to a "safe account" or to keep it secret, the assistant names it as a likely scam, advises her to hang up and call her family, and prepares nothing.

## The interview in her own words

Besides the three yes/no questions, the pause screen accepts free text: "He said he is from the police and I must not tell anyone". The bank reads it into the same three answers and attests only the "yes" ones. Answers can add risk and never remove it:

- a reading with no "yes" changes nothing;
- when Claude reads the text, the offline rules read it too, and an answer either of them finds is kept.

## The family note

The trusted person's card starts with a few sentences that put the facts together: the amount and how unusual it is, the call, her answers, and the advice to call her on a known number first. The note is display text. The decision, and every guarantee around it, stay with the contract.

## Offline and Claude modes

The API runs the assistant in one of two modes:

| Mode | Set by | Behaviour |
|---|---|---|
| `offline` (default) | nothing | Deterministic rules in three languages. No network, no cost. Used by the tests and the demo |
| `claude` | `KINSIGN_ASSISTANT=claude` | Claude through the Anthropic API, with the same tools and the same limits |

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # or sign in with `ant auth login`
KINSIGN_ASSISTANT=claude npm run dev:api
```

> [!NOTE]
> Claude mode calls a paid API on every message. It uses `claude-opus-5-5` at low effort with a cached system prompt, and a refused request falls back to the model the API chooses for its category.

The model sits behind `ModelPort` in `@kinsign/agent`, so the assistant's loop, tools and limits are tested with a scripted model and need no key.
