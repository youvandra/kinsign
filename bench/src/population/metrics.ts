/** Money-weighted metrics (docs/guides/benchmarks.md) over a weighted pool of items. */
import type { Defence, LearnedScores, Scenario } from './baselines.ts'
import type { Item } from './generate.ts'
import { COSTS } from './params.ts'

interface Weighted {
  v: number
  w: number
}

export function weightedQuantile(xs: readonly Weighted[], q: number): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a.v - b.v)
  const total = sorted.reduce((t, x) => t + x.w, 0)
  let acc = 0
  for (const x of sorted) if ((acc += x.w) >= q * total) return x.v
  return sorted[sorted.length - 1]!.v
}

export interface Metrics {
  /** Victim-release rate: share of scam attempts whose money leaves. */
  VRR: number
  /** Loss rate: share of attempted scam value that leaves. */
  LR: number
  scamValueAttempted: number
  preventedLoss: number
  /** False-hold rate over all legitimate transfers. */
  FHR: number
  /** False-hold rate over legitimate transfers made during a call. */
  FHR_onCall: number
  valueHeldInError: number
  heldLegitPerYear: number
  waitMedianMin: number
  waitP90Min: number
  frictionCost: number
  netBenefit: number
  liabilityAvoided: number
  breakEvenFrictionPerHold: number | null
  lossRateByTypology: Record<string, number>
}

export function measure(defence: Defence, scenario: Scenario, pool: readonly Item[], learned?: LearnedScores): Metrics {
  const scam = { n: 0, value: 0, lostN: 0, lostValue: 0 }
  const legit = { n: 0, value: 0, held: 0, heldValue: 0, onCall: 0, onCallHeld: 0, friction: 0 }
  const waits: Weighted[] = []
  const byTypology: Record<string, { value: number; lost: number }> = {}

  for (const item of pool) {
    const e = defence(item, scenario, learned)
    if (item.kind === 'scam') {
      scam.n += item.w
      scam.value += item.w * item.amount
      scam.lostN += item.w * e.loss
      scam.lostValue += item.w * item.amount * e.loss
      const t = (byTypology[item.typology] ??= { value: 0, lost: 0 })
      t.value += item.w * item.amount
      t.lost += item.w * item.amount * e.loss
    } else {
      legit.n += item.w
      legit.value += item.w * item.amount
      legit.friction += item.w * e.friction
      if (item.f.onChannel) legit.onCall += item.w
      if (e.held) {
        legit.held += item.w
        legit.heldValue += item.w * item.amount
        waits.push({ v: e.minutes, w: item.w })
        if (item.f.onChannel) legit.onCallHeld += item.w
      }
    }
  }

  const prevented = scam.value - scam.lostValue
  return {
    VRR: scam.lostN / scam.n,
    LR: scam.lostValue / scam.value,
    scamValueAttempted: scam.value,
    preventedLoss: prevented,
    FHR: legit.held / legit.n,
    FHR_onCall: legit.onCall ? legit.onCallHeld / legit.onCall : 0,
    valueHeldInError: legit.heldValue / legit.value,
    heldLegitPerYear: legit.held,
    waitMedianMin: weightedQuantile(waits, 0.5),
    waitP90Min: weightedQuantile(waits, 0.9),
    frictionCost: legit.friction,
    netBenefit: prevented - legit.friction,
    liabilityAvoided: COSTS.bankLiabilityShare * prevented,
    breakEvenFrictionPerHold: legit.held ? prevented / legit.held : null,
    lossRateByTypology: Object.fromEntries(Object.entries(byTypology).map(([k, t]) => [k, t.lost / t.value])),
  }
}
