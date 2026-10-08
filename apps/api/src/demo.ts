/**
 * Demo identities and seed data. Keys are derived from fixed labels so the demo
 * links stay the same across restarts. In a real deployment each device makes
 * its own key and only the address is enrolled; the bank holds only the
 * operator and review-desk keys.
 */
import type { Hex } from '@kinsign/protocol'
import type { Customer } from '@kinsign/core'
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
    knownPayees: new Set(['State Grid electricity', "Lin's school", 'Grandson Wei']),
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
