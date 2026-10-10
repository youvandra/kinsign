/**
 * Synthetic population of legitimate transfers and coerced attempts. The
 * trigger and the rule score are the engine's own (@kinsign/core), so the
 * model measures the policy the bank actually runs.
 */
import { bankScore, triggered, type Features } from '@kinsign/core'
import { BEHAVIOUR, OPERATOR, POP } from './params.ts'
import { POPULATION_SEED, Rng } from './rng.ts'

export type ItemKind = 'scam' | 'legit'

/** What the operator knows about the call in progress. All zero when there is none. */
export interface OperatorFeatures {
  callActive: number
  international: number
  numberAgeDaysLog: number
  scamReports: number
  distinctTargets24h: number
  roaming: number
  networkCallMinutes: number
}

export interface Item {
  /** An id bank and operator can both compute: the customer's number and the minute. */
  id: string
  kind: ItemKind
  typology: string
  /** How many real transfers this simulated one stands for. */
  w: number
  amount: number
  f: Features
  /** Rule score from @kinsign/core. */
  score: number
  trig: boolean
  /** Customer uses a money lock (baseline B4). */
  locked: boolean
  /** A circle member answers within the response window. */
  reached: boolean
  circleMin: number
  reviewMin: number
  /** The customer's operator is in the federation. */
  covered: boolean
  op: OperatorFeatures
}

const NO_CALL: OperatorFeatures = {
  callActive: 0,
  international: 0,
  numberAgeDaysLog: 0,
  scamReports: 0,
  distinctTargets24h: 0,
  roaming: 0,
  networkCallMinutes: 0,
}

export interface Population {
  items: Item[]
  /** The generator after the last item, for draws that must follow it (the FATE split). */
  rng: Rng
}

export function generatePopulation(seed = POPULATION_SEED): Population {
  const rng = new Rng(seed)
  let seq = 0

  function operatorFeatures(kind: ItemKind, f: Features): OperatorFeatures {
    // Every value is drawn unconditionally, so the stream, and so every other
    // item, is identical across operator settings; only these features differ.
    const p = kind === 'scam' ? OPERATOR.scamCaller : OPERATOR.legitCaller
    const u = [rng.next(), rng.next(), rng.next()] as const
    const age = rng.lognormal(p.numberAgeDaysMedian, 1.0)
    const reports = rng.lognormal(p.reportsMedianIfReported, 1.0)
    const targets = rng.lognormal(p.targets24hMedian, 0.9)
    if (f.callSeconds <= 0) return NO_CALL
    return {
      callActive: 1,
      international: u[0] < p.international ? 1 : 0,
      numberAgeDaysLog: Math.log10(1 + age),
      scamReports: u[1] < p.reported ? Math.round(reports) : 0,
      distinctTargets24h: Math.round(targets),
      roaming: u[2] < p.roaming ? 1 : 0,
      networkCallMinutes: f.callSeconds / 60,
    }
  }

  function item(kind: ItemKind, typology: string, w: number, amount: number, f: Features): Item {
    return {
      id: `ev${seq++}`,
      kind,
      typology,
      w,
      amount,
      f,
      score: bankScore(f),
      trig: triggered(f),
      locked: rng.bern(BEHAVIOUR.lockAdoption),
      reached: rng.bern(BEHAVIOUR.circleReach),
      circleMin: rng.lognormal(BEHAVIOUR.circleMinutesMedian, 0.8),
      reviewMin: rng.lognormal(BEHAVIOUR.reviewHoursMedian * 60, 0.7),
      covered: rng.bern(OPERATOR.coverage),
      op: operatorFeatures(kind, f),
    }
  }

  function legit(w: number): Item {
    const L = POP.legit
    const norm = rng.lognormal(POP.normMedian, POP.normSigma)
    const large = rng.bern(L.largeOneOff)
    const amount = Math.max(1, large ? norm * rng.lognormal(L.largeOneOffMultiple, 0.8) : rng.lognormal(norm, POP.legitAmountSigma))
    const onCall = rng.bern(L.onCall)
    const newPayee = large ? rng.bern(0.6) : !rng.bern(L.knownPayee)
    const minutes = onCall ? (newPayee ? rng.lognormal(L.newPayeeCallMinutesMedian, 0.7) : rng.exponential(L.callMinutesMean)) : 0
    const flaggedPayee = rng.bern(L.flaggedPayee)
    const screenCaptured = onCall && rng.bern(L.screenGivenCall)
    const remoteControlApp = onCall && rng.bern(L.remoteGivenCall)
    // A first payment to the person on the line usually means their number is not saved.
    const callerSaved = onCall && rng.bern(newPayee ? 0.35 : L.callerSavedGivenCall)
    const f: Features = {
      onChannel: onCall || screenCaptured || remoteControlApp,
      // The population model draws no after-call payments or call totals: it stays a lower bound for those two rules.
      afterCall: false,
      newPayee,
      amountRatio: amount / norm,
      aboveNorm: amount / norm > 3,
      channelRatio: amount / norm,
      overChannelCap: false,
      flaggedPayee,
      callSeconds: minutes * 60,
      screenCaptured,
      remoteControlApp,
      callerSaved,
    }
    return item('legit', 'legit', w, amount, f)
  }

  function scam(w: number): Item {
    let u = rng.next()
    const t = POP.scam.find((s) => (u -= s.share) < 0) ?? POP.scam[POP.scam.length - 1]!
    const norm = rng.lognormal(POP.normMedian, POP.normSigma)
    const amount = norm * rng.lognormal(t.multiple, POP.scamMultipleSigma)
    const onCall = rng.bern(t.onCall)
    const screen = rng.bern(t.screen)
    const remote = rng.bern(t.remote)
    const newPayee = rng.bern(POP.scamNewPayee)
    const flaggedPayee = rng.bern(POP.scamFlaggedPayee)
    const callSeconds = onCall ? rng.lognormal(t.minutes, 0.6) * 60 : 0
    const callerSaved = onCall && rng.bern(POP.scamCallerSaved)
    const f: Features = {
      onChannel: onCall || screen || remote,
      afterCall: false,
      newPayee,
      amountRatio: amount / norm,
      aboveNorm: amount / norm > 3,
      channelRatio: amount / norm,
      overChannelCap: false,
      flaggedPayee,
      callSeconds,
      screenCaptured: screen,
      remoteControlApp: remote,
      callerSaved,
    }
    return item('scam', t.name, w, amount, f)
  }

  const wLegit = (POP.customers * POP.legitPerCustomerYear) / POP.legitSample
  const wScam = (POP.customers * POP.scamPerCustomerYear) / POP.scamSample
  const items = [...Array.from({ length: POP.legitSample }, () => legit(wLegit)), ...Array.from({ length: POP.scamSample }, () => scam(wScam))]
  return { items, rng }
}
