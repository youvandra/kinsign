/**
 * Population model parameters. Every value here is an ASSUMPTION unless a
 * source is given: no public dataset gives the share of payments made during
 * calls, or a bank's cost per held transfer. The benchmark therefore reports
 * results across the sweeps below, and a bank substitutes its own numbers.
 * Amounts are in yuan.
 */
export const POP = {
  customers: 1_000_000, // results are scaled to one million customers per year
  legitPerCustomerYear: 40, // outgoing transfers that are not automatic debits
  legitSample: 400_000, // simulated legitimate transfers, weighted up to the population
  scamPerCustomerYear: 0.002, // coerced transfer attempts reaching the payment step
  scamSample: 20_000, // simulated scam attempts, weighted up

  legit: {
    knownPayee: 0.85,
    onCall: 0.04,
    callerSavedGivenCall: 0.8,
    screenGivenCall: 0.01,
    remoteGivenCall: 0.001,
    callMinutesMean: 4,
    /** A first payment to someone you are talking to (landlord, seller, contractor) runs longer. */
    newPayeeCallMinutesMedian: 9,
    /** One-off large payments: deposits, cars, tuition to a new school, a relative's hospital bill. */
    largeOneOff: 0.05,
    largeOneOffMultiple: 8,
    flaggedPayee: 0.001,
  },
  normMedian: 800,
  normSigma: 0.8,
  legitAmountSigma: 0.9,

  /** Typology mix and channel profile of scam attempts. */
  scam: [
    { name: 'authority', share: 0.25, onCall: 0.97, screen: 0.05, remote: 0.02, minutes: 35, multiple: 12 },
    { name: 'kin', share: 0.2, onCall: 0.97, screen: 0.02, remote: 0.0, minutes: 8, multiple: 6 },
    { name: 'refund', share: 0.25, onCall: 0.95, screen: 0.6, remote: 0.2, minutes: 25, multiple: 4 },
    { name: 'investment', share: 0.15, onCall: 0.7, screen: 0.05, remote: 0.0, minutes: 15, multiple: 8 },
    { name: 'takeover', share: 0.15, onCall: 0.97, screen: 0.95, remote: 0.7, minutes: 20, multiple: 6 },
  ],
  scamNewPayee: 0.92,
  scamFlaggedPayee: 0.15,
  scamCallerSaved: 0.1, // spoofed or saved under a familiar name
  scamMultipleSigma: 1.2,
}

/** Behaviour of people and reviewers. The coached-victim model sets every resist rate to 0. */
export const BEHAVIOUR = {
  /** Share of coached victims who stop after a warning, a pause or a confirmation question. Swept. */
  resist: [0, 0.2, 0.4],
  /** A circle member reached in time. */
  circleReach: 0.85,
  /** A reached member who approves a scam anyway (pre-empted by the caller, or fooled). Swept. */
  circleFooled: [0, 0.05, 0.1, 0.2],
  /** A reviewer who releases a scam after the call-back. */
  reviewerMiss: 0.1,
  /** A member who wrongly blocks a legitimate transfer. */
  circleWrongBlock: 0.02,
  circleMinutesMedian: 8,
  reviewHoursMedian: 4,
  /** Money lock: share of customers who lock funds, and the transfer size that needs locked funds. */
  lockAdoption: 0.1,
  lockNeededAboveNorm: 5,
}

/** Cost of friction. Swept as low / mid / high. */
export const COSTS = {
  levels: {
    low: { warn: 0.1, pause: 0.3, confirm: 0.2, holdHandling: 5, branchVisit: 50, abandonMargin: 50 },
    mid: { warn: 0.5, pause: 1, confirm: 0.5, holdHandling: 15, branchVisit: 100, abandonMargin: 200 },
    high: { warn: 1, pause: 2, confirm: 1, holdHandling: 40, branchVisit: 200, abandonMargin: 500 },
  },
  /** Daily cost of money for delayed funds. */
  dailyRate: 0.03 / 365,
  abandonAfterFastRelease: 0.03,
  abandonAfterReview: 0.15,
  abandonAfterWrongBlock: 0.5,
  /** Under a UK-style regime the sending bank's share of a reimbursed loss. */
  bankLiabilityShare: 0.5,
}

/**
 * Operator-side signals about the call in progress (assumptions). Scam rings
 * favour fresh, often international numbers that reach many subscribers a day;
 * many are already reported. Some use fresh domestic numbers with no reports,
 * which is what keeps the federated model from being trivially perfect.
 */
const OPERATOR_SETTINGS = {
  /** Scam rings favour fresh, often international numbers that reach many people; about a third already reported. */
  base: {
    coverage: 0.7,
    scamCaller: { international: 0.45, numberAgeDaysMedian: 30, reported: 0.35, reportsMedianIfReported: 5, targets24hMedian: 20, roaming: 0.1 },
    legitCaller: { international: 0.08, numberAgeDaysMedian: 900, reported: 0.005, reportsMedianIfReported: 1, targets24hMedian: 5, roaming: 0.05 },
  },
  /** Rings that rotate domestic numbers and keep volumes low: the operator signal is weak. */
  hard: {
    coverage: 0.7,
    scamCaller: { international: 0.2, numberAgeDaysMedian: 200, reported: 0.15, reportsMedianIfReported: 3, targets24hMedian: 8, roaming: 0.07 },
    legitCaller: { international: 0.08, numberAgeDaysMedian: 900, reported: 0.005, reportsMedianIfReported: 1, targets24hMedian: 5, roaming: 0.05 },
  },
}
export const OPERATOR_SETTING = (process.env.KINSIGN_OPERATOR ?? 'base') as keyof typeof OPERATOR_SETTINGS
export const OPERATOR = OPERATOR_SETTINGS[OPERATOR_SETTING]
