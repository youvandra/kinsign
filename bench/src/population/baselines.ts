/**
 * Each defence modelled on one item: the expected share of a scam's value that
 * leaves, or the friction cost a legitimate transfer pays. Coached-victim
 * model: a victim does what the caller says unless `resist` says otherwise.
 */
import type { Item } from './generate.ts'
import { BEHAVIOUR, COSTS } from './params.ts'

export type CostLevel = keyof typeof COSTS.levels
export type Costs = (typeof COSTS.levels)[CostLevel]

/** Which score Kinsign's hold threshold reads. "rule" is @kinsign/core's; the others come from the FATE run. */
export type ScoreSource = 'rule' | 'bankLearned' | 'federated'

export interface Scenario {
  /** Share of coached victims who heed a warning, pause or confirmation. */
  resist: number
  /** Share of reached circle members who approve a scam anyway. */
  fooled: number
  cost: Costs
  /** Hold threshold on the score. 0 holds every triggered transfer (the core). */
  theta: number
  score?: ScoreSource
}

export interface Evaluation {
  /** 0..1, expected share of a scam's amount that leaves. */
  loss: number
  /** Yuan, legitimate transfers only. */
  friction: number
  held: boolean
  /** Minutes a legitimate transfer waited. */
  minutes: number
}

/** Federated and learned scores, by item id, from the FATE run. */
export interface LearnedScores {
  federated: ReadonlyMap<string, number>
  bankLearned: ReadonlyMap<string, number>
}

export type Defence = (item: Item, s: Scenario, learned?: LearnedScores) => Evaluation

const PASS: Evaluation = { loss: 0, friction: 0, held: false, minutes: 0 }
const LOSE: Evaluation = { loss: 1, friction: 0, held: false, minutes: 0 }
/** B5's score threshold. */
const SELF_CONFIRM_GATE = 0.5

/** A control that leaves the decision with the victim: shown, it stops only those who resist. */
function victimDecides(shown: boolean, item: Item, s: Scenario, friction: number, minutes = 0): Evaluation {
  if (item.kind === 'scam') return { ...LOSE, loss: shown ? 1 - s.resist : 1 }
  return { ...PASS, friction: shown ? friction : 0, minutes: shown ? minutes : 0 }
}

export function scoreFor(item: Item, source: ScoreSource = 'rule', learned?: LearnedScores): number {
  if (source === 'rule' || !learned) return item.score
  const bank = learned.bankLearned.get(item.id) ?? item.score
  if (source === 'bankLearned') return bank
  return item.covered ? (learned.federated.get(item.id) ?? bank) : bank
}

export const kinsign: Defence = (item, s, learned) => {
  const hold = item.trig && scoreFor(item, s.score, learned) >= s.theta
  if (!hold) return item.kind === 'scam' ? LOSE : PASS
  if (item.kind === 'scam') {
    // The holder can never release (contract invariant I1): loss only if a reached member is fooled or the reviewer misses.
    return { loss: item.reached ? s.fooled : BEHAVIOUR.reviewerMiss, friction: 0, held: true, minutes: 0 }
  }
  const minutes = item.reached ? item.circleMin : item.reviewMin
  const delay = item.amount * COSTS.dailyRate * (minutes / 1440)
  const pAbandon = item.reached
    ? BEHAVIOUR.circleWrongBlock * COSTS.abandonAfterWrongBlock + (1 - BEHAVIOUR.circleWrongBlock) * COSTS.abandonAfterFastRelease
    : COSTS.abandonAfterReview
  return { loss: 0, friction: s.cost.holdHandling + delay + pAbandon * s.cost.abandonMargin, held: true, minutes }
}

export const BASELINES: Record<string, Defence> = {
  'B0 no protection': () => LOSE,
  'B1 in-call warning': (i, s) => victimDecides(i.f.onChannel, i, s, s.cost.warn),
  'B2 warning + 30 s pause': (i, s) => victimDecides(i.f.onChannel && !i.f.callerSaved && i.f.screenCaptured, i, s, s.cost.pause, 0.5),
  'B3 guardian notification': () => LOSE,
  'B4 money lock': (i, s) => {
    if (i.kind === 'scam') return i.locked ? PASS : LOSE
    const branch = i.locked && i.f.amountRatio > BEHAVIOUR.lockNeededAboveNorm
    return branch ? { loss: 0, friction: s.cost.branchVisit, held: true, minutes: 24 * 60 } : PASS
  },
  'B5 score + self-confirmation': (i, s) => victimDecides(i.score >= SELF_CONFIRM_GATE, i, s, s.cost.confirm),
  'K Kinsign core': kinsign,
}
