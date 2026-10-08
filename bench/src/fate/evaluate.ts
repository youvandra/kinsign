/**
 * Compares three hold scores on the same events: the rule score, SecureBoost
 * on bank features only, and federated SecureBoost on bank + operator features.
 */
import { kinsign, type LearnedScores, type Scenario, type ScoreSource } from '../population/baselines.ts'
import type { Item } from '../population/generate.ts'
import { measure, type Metrics } from '../population/metrics.ts'
import { auc, scoredPool } from './scores.ts'

const SOURCES: ScoreSource[] = ['rule', 'bankLearned', 'federated']
const THETAS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.97, 0.99]
/** "Matched loss": at most this much more loss than holding every triggered transfer. */
const MATCHED_LOSS_SLACK = 0.005

export interface CurvePoint {
  theta: number
  LR: number
  FHR: number
  FHR_onCall: number
  frictionCost: number
  netBenefit: number
}

export interface FederatedComparison {
  scoredEvents: { scam: number; legit: number }
  auc: Record<ScoreSource, number>
  lossRateHoldAllTriggered: number
  matched: Record<ScoreSource, CurvePoint>
  curves: Record<ScoreSource, CurvePoint[]>
}

const point = (theta: number, m: Metrics): CurvePoint => ({
  theta,
  LR: m.LR,
  FHR: m.FHR,
  FHR_onCall: m.FHR_onCall,
  frictionCost: m.frictionCost,
  netBenefit: m.netBenefit,
})

export function compareScores(items: readonly Item[], learned: LearnedScores, base: Scenario): FederatedComparison {
  const { pool, scored } = scoredPool(items, learned)
  const curve = (source: ScoreSource) => THETAS.map((theta) => point(theta, measure(kinsign, { ...base, theta, score: source }, pool, learned)))
  const curves = Object.fromEntries(SOURCES.map((s) => [s, curve(s)])) as Record<ScoreSource, CurvePoint[]>
  const holdAll = measure(kinsign, { ...base, theta: 0 }, pool, learned).LR
  const matched = Object.fromEntries(
    SOURCES.map((s) => {
      const ok = curves[s].filter((c) => c.LR <= holdAll + MATCHED_LOSS_SLACK)
      return [s, ok.reduce((best, c) => (c.frictionCost < best.frictionCost ? c : best), ok[0]!)]
    }),
  ) as Record<ScoreSource, CurvePoint>
  return {
    scoredEvents: scored,
    auc: Object.fromEntries(SOURCES.map((s) => [s, auc(pool, s, learned)])) as Record<ScoreSource, number>,
    lossRateHoldAllTriggered: holdAll,
    matched,
    curves,
  }
}
