/**
 * The FATE predictions, read back and lined up with the population. Only
 * triggered test events on a federated operator have FATE scores, so the pool
 * is every untriggered event plus the scored events re-weighted to stand for
 * all triggered events. Coverage and the split are random, so the re-weighting
 * is unbiased.
 */
import { existsSync, readFileSync } from 'node:fs'
import type { LearnedScores, ScoreSource } from '../population/baselines.ts'
import { scoreFor } from '../population/baselines.ts'
import type { Item } from '../population/generate.ts'

function readPredictions(file: URL): Map<string, number> {
  const [head = '', ...rows] = readFileSync(file, 'utf8').trim().split('\n')
  const cols = head.split(',')
  const id = cols.indexOf('id')
  const score = cols.indexOf('predict_score')
  return new Map(rows.map((r) => r.split(',')).map((c) => [c[id]!, Number(c[score])]))
}

export function loadLearnedScores(outDir: URL): LearnedScores | null {
  const federated = new URL('pred_federated.csv', outDir)
  if (!existsSync(federated)) return null
  return { federated: readPredictions(federated), bankLearned: readPredictions(new URL('pred_bank_only.csv', outDir)) }
}

export interface ScoredPool {
  pool: Item[]
  scored: { scam: number; legit: number }
}

export function scoredPool(items: readonly Item[], learned: LearnedScores): ScoredPool {
  const scored = items.filter((i) => i.trig && learned.federated.has(i.id))
  const count = (xs: readonly Item[], kind: Item['kind']) => xs.filter((i) => i.kind === kind).length
  const triggered = items.filter((i) => i.trig)
  const scale = { scam: count(triggered, 'scam') / count(scored, 'scam'), legit: count(triggered, 'legit') / count(scored, 'legit') }
  return {
    pool: [...items.filter((i) => !i.trig), ...scored.map((i) => ({ ...i, w: i.w * scale[i.kind] }))],
    scored: { scam: count(scored, 'scam'), legit: count(scored, 'legit') },
  }
}

/** Weighted ROC AUC over the triggered events of a pool. */
export function auc(pool: readonly Item[], source: ScoreSource, learned: LearnedScores): number {
  const points = pool
    .filter((i) => i.trig)
    .map((i) => ({ s: scoreFor(i, source, learned), positive: i.kind === 'scam', w: i.w }))
    .sort((a, b) => a.s - b.s)
  let negBelow = 0
  let area = 0
  let pos = 0
  let neg = 0
  for (let k = 0; k < points.length; ) {
    let j = k
    let wp = 0
    let wn = 0
    while (j < points.length && points[j]!.s === points[k]!.s) {
      if (points[j]!.positive) wp += points[j]!.w
      else wn += points[j]!.w
      j++
    }
    area += wp * (negBelow + wn / 2)
    negBelow += wn
    pos += wp
    neg += wn
    k = j
  }
  return area / (pos * neg)
}
