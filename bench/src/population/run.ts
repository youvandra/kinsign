/**
 * Money-weighted population benchmark (docs/guides/benchmarks.md).
 *
 * One million customers for a year: every defence runs on the same draws, and
 * the run reports loss rate, prevented loss, friction cost, net benefit and
 * the break-even friction per hold. Release enforcement itself is proven
 * elsewhere (contract tests, and the scenario corpus against the deployed
 * contract). Every parameter is in params.ts and most are assumptions: the
 * sweeps are the result, not any single number.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { compareScores } from '../fate/evaluate.ts'
import { loadLearnedScores } from '../fate/scores.ts'
import { fateOutDir, RESULTS_DIR } from '../paths.ts'
import { BASELINES, kinsign, type CostLevel, type Scenario } from './baselines.ts'
import { generatePopulation } from './generate.ts'
import { measure } from './metrics.ts'
import { BEHAVIOUR, COSTS, OPERATOR_SETTING, POP } from './params.ts'
import { renderReport, type PopulationResults } from './report.ts'

const THRESHOLDS = [0, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]

const { items } = generatePopulation()
const base: Scenario = { resist: 0, fooled: 0, cost: COSTS.levels.mid, theta: 0 }
const each = <T>(f: (name: string, defence: (typeof BASELINES)[string]) => T) => Object.fromEntries(Object.entries(BASELINES).map(([n, d]) => [n, f(n, d)]))
const learned = loadLearnedScores(fateOutDir(OPERATOR_SETTING))

const results: PopulationResults = {
  note: 'One million customers, one year, yuan. Parameters in bench/src/population/params.ts; most are assumptions. Coached-victim model: resist = 0 unless swept.',
  operatorSetting: OPERATOR_SETTING,
  population: {
    customers: POP.customers,
    legitTransfers: POP.customers * POP.legitPerCustomerYear,
    scamAttempts: POP.customers * POP.scamPerCustomerYear,
    legitSample: POP.legitSample,
    scamSample: POP.scamSample,
  },
  main: each((_, d) => measure(d, base, items)),
  resistSweep: BEHAVIOUR.resist.map((resist) => ({ resist, ...each((_, d) => measure(d, { ...base, resist }, items).LR) })),
  kinsignSweep: BEHAVIOUR.circleFooled.flatMap((fooled) =>
    (Object.keys(COSTS.levels) as CostLevel[]).map((costs) => {
      const m = measure(kinsign, { ...base, fooled, cost: COSTS.levels[costs] }, items)
      return {
        circleFooled: fooled,
        costs,
        LR: m.LR,
        frictionCost: m.frictionCost,
        netBenefit: m.netBenefit,
        breakEvenFrictionPerHold: m.breakEvenFrictionPerHold,
      }
    }),
  ),
  lossFrictionCurve: THRESHOLDS.map((theta) => {
    const m = measure(kinsign, { ...base, theta }, items)
    return { theta, LR: m.LR, FHR: m.FHR, frictionCost: m.frictionCost, netBenefit: m.netBenefit }
  }),
  federated: learned ? compareScores(items, learned, base) : null,
}

mkdirSync(RESULTS_DIR, { recursive: true })
writeFileSync(new URL(`population-${OPERATOR_SETTING}.json`, RESULTS_DIR), JSON.stringify(results, null, 2))
const markdown = renderReport(results)
writeFileSync(new URL(`population-${OPERATOR_SETTING}.md`, RESULTS_DIR), markdown)
console.log(markdown)
