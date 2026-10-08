/** Renders the population benchmark as Markdown (results/population-<setting>.md). */
import type { FederatedComparison } from '../fate/evaluate.ts'
import type { ScoreSource } from './baselines.ts'
import type { Metrics } from './metrics.ts'

export interface PopulationResults {
  note: string
  operatorSetting: string
  population: { customers: number; legitTransfers: number; scamAttempts: number; legitSample: number; scamSample: number }
  main: Record<string, Metrics>
  resistSweep: ({ resist: number } & Record<string, number>)[]
  kinsignSweep: { circleFooled: number; costs: string; LR: number; frictionCost: number; netBenefit: number; breakEvenFrictionPerHold: number | null }[]
  lossFrictionCurve: { theta: number; LR: number; FHR: number; frictionCost: number; netBenefit: number }[]
  federated: FederatedComparison | null
}

const yuan = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)} m` : Math.round(v).toLocaleString('en-US'))
const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const row = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`
const rule = (n: number) => `|${'---|'.repeat(n)}`

const SCORE_NAMES: Record<ScoreSource, string> = {
  rule: 'Rule score (@kinsign/core)',
  bankLearned: 'SecureBoost, bank features only',
  federated: 'SecureBoost, bank + operator (FATE)',
}

export function renderReport(r: PopulationResults): string {
  const out: string[] = ['# Population benchmark', '', r.note, '']
  const b0 = r.main['B0 no protection']!
  out.push(
    `Scam value attempted: ${yuan(b0.scamValueAttempted)} yuan from ${yuan(r.population.scamAttempts)} attempts; ${yuan(r.population.legitTransfers)} legitimate transfers.`,
    '',
  )

  out.push('## Coached victim, circle not fooled, mid costs', '')
  out.push(
    row([
      'Baseline',
      'VRR',
      'Loss rate',
      'Prevented loss',
      'Legit held',
      'Held on calls',
      'Value held',
      'Friction cost',
      'Net benefit',
      'Liability avoided (50%)',
    ]),
    rule(10),
  )
  for (const [name, m] of Object.entries(r.main))
    out.push(
      row([
        name,
        pct(m.VRR),
        pct(m.LR),
        yuan(m.preventedLoss),
        pct(m.FHR),
        pct(m.FHR_onCall),
        pct(m.valueHeldInError),
        yuan(m.frictionCost),
        yuan(m.netBenefit),
        yuan(m.liabilityAvoided),
      ]),
    )
  const k = r.main['K Kinsign core']!
  out.push(
    '',
    `Kinsign holds ${yuan(k.heldLegitPerYear)} legitimate transfers a year; median wait ${k.waitMedianMin.toFixed(0)} min, p90 ${k.waitP90Min.toFixed(0)} min. Break-even friction per hold: ${yuan(k.breakEvenFrictionPerHold ?? 0)} yuan.`,
    '',
  )
  out.push(
    'Kinsign loss rate by typology: ' +
      Object.entries(k.lossRateByTypology)
        .map(([t, v]) => `${t} ${pct(v)}`)
        .join(', '),
    '',
  )

  const names = Object.keys(r.main)
  out.push('## Loss rate when some coached victims resist warnings', '')
  out.push(row(['Resist', ...names]), rule(names.length + 1))
  for (const s of r.resistSweep) out.push(row([pct(s.resist), ...names.map((n) => pct(s[n]!))]))

  out.push('', '## Kinsign: circle fooled × cost level', '')
  out.push(row(['Circle fooled', 'Costs', 'Loss rate', 'Friction cost', 'Net benefit', 'Break-even per hold']), rule(6))
  for (const s of r.kinsignSweep)
    out.push(row([pct(s.circleFooled), s.costs, pct(s.LR), yuan(s.frictionCost), yuan(s.netBenefit), yuan(s.breakEvenFrictionPerHold ?? 0)]))

  out.push('', '## Loss–friction curve (hold threshold on the rule score)', '')
  out.push(row(['θ', 'Loss rate', 'Legit held', 'Friction cost', 'Net benefit']), rule(5))
  for (const c of r.lossFrictionCurve) out.push(row([c.theta, pct(c.LR), pct(c.FHR), yuan(c.frictionCost), yuan(c.netBenefit)]))

  const fed = r.federated
  if (fed) {
    const sources = Object.keys(SCORE_NAMES) as ScoreSource[]
    out.push('', `## Federated layer (FATE PSI + hetero SecureBoost), operator setting: ${r.operatorSetting}`, '')
    out.push(
      `Scored on ${fed.scoredEvents.scam + fed.scoredEvents.legit} triggered test events on a federated operator (${fed.scoredEvents.scam} scam, ${fed.scoredEvents.legit} legitimate), re-weighted to the population. Holding every triggered transfer loses ${pct(fed.lossRateHoldAllTriggered)}.`,
      '',
    )
    out.push(row(['Hold score', 'AUC', 'Best θ at ≤ +0.5 pp loss', 'Loss rate', 'Legit held', 'Held on calls', 'Friction cost', 'Net benefit']), rule(8))
    for (const s of sources) {
      const m = fed.matched[s]
      out.push(row([SCORE_NAMES[s], fed.auc[s].toFixed(3), m.theta, pct(m.LR), pct(m.FHR), pct(m.FHR_onCall), yuan(m.frictionCost), yuan(m.netBenefit)]))
    }
    out.push('', 'Loss–friction curves:', '', row(['θ', ...sources.map((s) => `${SCORE_NAMES[s]}: loss / held`)]), rule(sources.length + 1))
    fed.curves.rule.forEach((c, i) => out.push(row([c.theta, ...sources.map((s) => `${pct(fed.curves[s][i]!.LR)} / ${pct(fed.curves[s][i]!.FHR)}`)])))
  }
  return out.join('\n') + '\n'
}
