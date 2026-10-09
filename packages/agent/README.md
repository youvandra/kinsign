# @kinsign/agent

The payment assistant, the in-call interview reader and the family note.

| File | What it is |
|---|---|
| `model.ts` | `ModelPort`, the model behind everything; tests use a scripted one |
| `claude.ts` | `ClaudeModel`: Claude through the Anthropic SDK |
| `tools.ts` | The four tools. They read and draft; none moves money |
| `assistant.ts` | Conversations, the tool loop, drafts |
| `interview.ts` | Free text to "yes"-only interview answers (I3) |
| `summary.ts` | The family note, from the hold's facts |
| `offline.ts` | The rules used without a model, in en, zh and id |
| `prompts.ts` | System prompts, fixed so the prompt cache holds |

Without a model every feature runs on the offline rules, so nothing here needs a key to test. See [`docs/concepts/assistant.md`](../../docs/concepts/assistant.md).
