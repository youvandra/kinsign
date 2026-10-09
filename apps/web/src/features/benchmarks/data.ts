/**
 * Benchmark results, imported from the committed files in bench/results/ at
 * build time. The page derives every figure from here and states none itself.
 */
import fisco from '@results/scenarios-fisco.json'
import anvil from '@results/scenarios-anvil.json'
import populationBase from '@results/population-base.json'
import populationHard from '@results/population-hard.json'

export interface ScenarioSummary {
  network: string
  cases: number
  passed: number
  scam: { cases: number; victimReleases: number; valueAttempted: number; valueLost: number; held: number; refusedOnChain: number }
  legit: { cases: number; paidAtOnce: number; held: number; releasedAfterHold: number }
  transactions: number
  failedTransactions: number
}

export interface ScenarioCase {
  id: string
  kind: 'scam' | 'legit'
  typology: string
  pass: boolean
  paidToPayee: number
  amount: number
}

export interface DefenceMetrics {
  LR: number
  preventedLoss: number
  FHR: number
  frictionCost: number
  netBenefit: number
  scamValueAttempted: number
}

export type ScoreSource = 'rule' | 'bankLearned' | 'federated'

export interface Population {
  population: { customers: number; legitTransfers: number; scamAttempts: number }
  main: Record<string, DefenceMetrics>
  federated: {
    auc: Record<ScoreSource, number>
    matched: Record<ScoreSource, { LR: number; FHR: number; frictionCost: number }>
  }
}

export const SCENARIOS = [
  { label: 'Local anvil', summary: anvil.summary as ScenarioSummary, cases: anvil.results as ScenarioCase[] },
  { label: 'FISCO BCOS', summary: fisco.summary as ScenarioSummary, cases: fisco.results as ScenarioCase[] },
]

export const POPULATION = { base: populationBase as Population, hard: populationHard as Population }
export type OperatorSetting = keyof typeof POPULATION

export const KINSIGN_KEY = 'K Kinsign core'

/** "B1 in-call warning" → { code: 'B1', name: 'In-call warning' } */
export function defenceName(key: string): { code: string; name: string } {
  const [code = '', ...rest] = key.split(' ')
  const name = rest.join(' ')
  return { code, name: name.charAt(0).toUpperCase() + name.slice(1) }
}

export const SOURCE_LABELS: Record<ScoreSource, string> = {
  rule: 'Rule score',
  bankLearned: 'Bank-only model',
  federated: 'Federated (bank + operator)',
}

/** Scam cases per typology on one network: how many, and how much reached the payee. */
export function byTypology(cases: ScenarioCase[]) {
  const rows = new Map<string, { cases: number; passed: number; attempted: number; lost: number }>()
  for (const c of cases) {
    if (c.kind !== 'scam') continue
    const r = rows.get(c.typology) ?? { cases: 0, passed: 0, attempted: 0, lost: 0 }
    r.cases++
    if (c.pass) r.passed++
    r.attempted += c.amount
    r.lost += c.paidToPayee
    rows.set(c.typology, r)
  }
  return [...rows.entries()].map(([typology, r]) => ({ typology, ...r }))
}
