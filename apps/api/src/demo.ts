/**
 * Demo identities and seed data. Keys are derived from fixed labels so the demo
 * links stay the same across restarts. In a real deployment each device makes
 * its own key and only the address is enrolled; the bank holds only the
 * operator and review-desk keys.
 */
import type { Hex, Txn } from '@kinsign/protocol'
import type { Customer } from '@kinsign/core'
import { categorize, monthOf, SAVINGS_PAYEE, shift } from '@kinsign/finance'
import { keccak256, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const derive = (label: string): Hex => keccak256(toHex(`kinsign-demo:${label}`))

export const DEMO_KEYS = {
  /** The bank's risk engine. */
  operator: derive('operator'),
  /** The bank's branch or call-back desk. */
  reviewer: derive('reviewer'),
  /** Mum's phone. Handed to her browser through the demo link, never used by the API. */
  mum: derive('mum'),
  /** Her son's phone. Same: handed out, never used by the API. */
  son: derive('son'),
  /** The address the caller's "colleague" would use. */
  colleague: derive('caller-colleague'),
} as const

export const addressOf = (key: Hex): Hex => privateKeyToAccount(key).address

export const DEMO_CUSTOMER_ID = 'mum'

export function demoCustomer(): Customer {
  return {
    id: DEMO_CUSTOMER_ID,
    address: addressOf(DEMO_KEYS.mum),
    balance: 250_000,
    knownPayees: new Set(['State Grid electricity', "Lin's school", 'Grandson Wei', ...STATEMENT_PAYEES, SAVINGS_PAYEE]),
    history: [180, 3_000, 500, 1_200, 260, 800, 1_500],
  }
}

/** Links carry the device key in the URL fragment, which browsers never send to a server. */
export function demoLinks() {
  return {
    customer: `/phone#k=${DEMO_KEYS.mum}`,
    family: `/family#k=${DEMO_KEYS.son}`,
    colleague: addressOf(DEMO_KEYS.colleague),
  }
}

type Row = [day: number, payee: string, amount: number, direction?: 'in']

/** A retired teacher's month: pension, support from her son, bills, shopping, tea with friends. */
const MONTHS: Row[][] = [
  // three months ago
  [
    [1, 'Pension', 6_800, 'in'],
    [2, 'Support from son', 1_000, 'in'],
    [3, 'Property management', 420],
    [4, 'Hema supermarket', 420],
    [5, 'State Grid electricity', 255],
    [6, 'China Mobile', 58],
    [7, 'Shenzhen Water', 82],
    [10, 'Metro card', 60],
    [11, 'Hema supermarket', 380],
    [12, 'Pharmacy', 160],
    [14, 'Tea house', 140],
    [15, 'Grandson Wei', 500],
    [18, 'Hema supermarket', 400],
    [25, 'Hema supermarket', 350],
    [26, 'Tea house', 150],
  ],
  // two months ago
  [
    [1, 'Pension', 6_800, 'in'],
    [2, 'Support from son', 1_000, 'in'],
    [3, 'Property management', 420],
    [4, 'Hema supermarket', 410],
    [5, 'State Grid electricity', 270],
    [6, 'China Mobile', 58],
    [7, 'Shenzhen Water', 88],
    [10, 'Metro card', 60],
    [11, 'Hema supermarket', 390],
    [12, 'Pharmacy', 210],
    [14, 'Tea house', 160],
    [15, 'Grandson Wei', 500],
    [18, 'Hema supermarket', 420],
    [25, 'Hema supermarket', 360],
    [27, 'Tea house', 130],
  ],
  // last month: the school term starts
  [
    [1, 'Pension', 6_800, 'in'],
    [1, "Lin's school", 3_000],
    [2, 'Support from son', 1_000, 'in'],
    [3, 'Property management', 420],
    [4, 'Hema supermarket', 400],
    [5, 'State Grid electricity', 260],
    [6, 'China Mobile', 58],
    [7, 'Shenzhen Water', 85],
    [10, 'Metro card', 60],
    [11, 'Hema supermarket', 370],
    [12, 'Pharmacy', 180],
    [14, 'Tea house', 150],
    [15, 'Grandson Wei', 500],
    [18, 'Hema supermarket', 410],
    [25, 'Hema supermarket', 380],
    [26, 'Tea house', 140],
  ],
  // this month so far: electricity up, the phone charged twice, shopping faster than usual
  [
    [1, 'Pension', 6_800, 'in'],
    [2, 'Support from son', 1_000, 'in'],
    [2, 'Hema supermarket', 480],
    [3, 'Property management', 420],
    [3, 'China Mobile', 58],
    [5, 'State Grid electricity', 360],
    [6, 'China Mobile', 58],
    [7, 'Shenzhen Water', 86],
    [8, 'Hema supermarket', 430],
  ],
]

const STATEMENT_PAYEES = [
  ...new Set(
    MONTHS.flat()
      .filter((r) => !r[3])
      .map((r) => r[1]),
  ),
]

/** Her statement up to `asOf`: three full months and this month so far. */
export function demoStatement(asOf: number): Txn[] {
  const month = monthOf(asOf)
  const today = new Date(asOf).getUTCDate()
  const rows: Txn[] = []
  MONTHS.forEach((list, i) => {
    const m = shift(month, MONTHS.length - 1 - i)
    for (const [day, payee, amount, direction = 'out'] of list) {
      if (m === month && day > today) continue
      const at = Date.parse(`${m}-${String(day).padStart(2, '0')}T02:00:00Z`)
      rows.push({ id: `s-${m}-${rows.length}`, at, payee, amount, direction, category: categorize(payee, direction) })
    }
  })
  return rows
}
