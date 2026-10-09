---
title: Budgets, bills and insights
description: How the assistant turns the customer's statement into a monthly summary, bill checks, budgets and advice she can act on.
---

# Budgets, bills and insights

The assistant's everyday job is the customer's money: where it went this month, which bills look wrong, how her budgets are doing, and what to do next. `@kinsign/finance` computes all of it from her statement with pure functions, so the phone, the assistant and the tests read the same numbers.

```ts
import { financeView } from '@kinsign/finance'

const view = financeView(statement, budgets, Date.now(), 'en')
view.summary    // this month: income, spending, what is left, spending by category
view.bills      // regular bills, with flags for a rise or a double charge
view.budgets    // each budget, with spending projected to the end of the month
view.insights   // ranked advice, each with the evidence and an optional prepared action
```

## Monthly summary

| Field | Meaning |
|---|---|
| `income`, `spending`, `net` | This month so far. Moving money to savings is not spending |
| `savingsRate` | Net over income |
| `byCategory` | Spending per category, each with its average over the previous three months |
| `daysElapsed`, `daysInMonth` | Used to project the month at its current pace |

Payees are sorted into twelve categories (utilities, phone, groceries, family, dining and so on) by name, in Chinese, English and Indonesian.

## Bills

A bill is a payee in a bill category (housing, utilities, phone, education) that she paid in at least two of the last three months. Each bill carries its usual amount, the latest one, when the next is due, and flags:

| Flag | When |
|---|---|
| `increased` | This month's bill is at least 25% above the usual amount |
| `duplicate` | The same amount was charged twice within seven days this month |
| `dueSoon` | The next bill is due within five days and has not arrived |

Two trips to the supermarket are shopping, not a double charge: groceries are budgeted, not treated as bills.

## Budgets

The customer sets a monthly budget for an everyday category (groceries, dining, transport, health, other) from her own screen. Each budget line shows what she spent, the projection to the end of the month at the current pace, and a status: `ok`, `watch` when the projection passes the limit, or `over`.

## Insights

| Kind | Example | Prepared action |
|---|---|---|
| `duplicateCharge` | China Mobile charged you twice | |
| `billIncrease` | State Grid electricity is up 38% | |
| `budgetPace` | Groceries is heading over budget | |
| `categoryJump` | Groceries is running high | Set a budget at the usual amount |
| `saveSurplus` | You kept ¥1,400 last month | Draft a transfer to her savings account |
| `setBudget` | Set a budget for dining out | Set a budget at the usual amount |

Insights are ranked `act`, `watch`, then `info`, and written in the reader's language. Nothing is said about the month's pace in its first five days.

## Who acts

Advice never acts by itself:

- a suggested budget is saved only when the customer taps it (`POST /api/finance/budget`);
- a suggested transfer to savings becomes an assistant draft, which moves money only when she confirms it, through the same hold rule as every other payment.

The assistant reads the same data through three tools, `spending_summary`, `bills` and `budgets_and_tips`. See [Payment assistant](/docs/concepts/assistant).
