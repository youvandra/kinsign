/**
 * Runs the scripted scenario corpus through the engine against the real
 * KinsignRelease bytecode. Default target is a local anvil (it can move time,
 * which the timelock and review window need); KINSIGN_RPC points it at FISCO
 * BCOS instead, where scenarios that need time travel are skipped.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fundOnFisco, networkFromEnv, ReleaseClient } from '@kinsign/chain'
import { Engine, MockLedger } from '@kinsign/core'
import type { Hex } from '@kinsign/protocol'
import { keccak256, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RESULTS_DIR } from '../paths.ts'
import { legitScenarios, scamScenarios, type Scenario } from './corpus.ts'
import { playStep, type Actors } from './steps.ts'

const ANVIL_PORT = 8547
const RESPONSE_WINDOW_SECONDS = 30n * 60n

const keyOf = (label: string): Hex => keccak256(toHex(`kinsign-bench:${label}`))
const address = (key: Hex) => privateKeyToAccount(key).address
const actorsFor = (i: number, reviewer: Hex): Actors => ({
  holder: keyOf(`holder:${i}`),
  member: keyOf(`member:${i}`),
  accomplice: keyOf(`accomplice:${i}`),
  reviewer,
})

interface CaseResult {
  id: string
  kind: Scenario['kind']
  typology: string
  lang: string
  variant: string
  amount: number
  decision: string
  score: number
  expect: string
  final: string
  pass: boolean
  paidToPayee: number
  refusals: string[]
  problems: string[]
}

function newCustomer(id: string, holderKey: Hex) {
  return {
    id,
    address: address(holderKey),
    balance: 200_000,
    knownPayees: new Set(['electric', 'school']),
    history: [800, 1_200, 1_500, 1_500, 2_000, 300, 1_000],
  }
}

async function runCase(i: number, s: Scenario, engine: Engine, chain: ReleaseClient, ledger: MockLedger, operator: Hex, actors: Actors): Promise<CaseResult> {
  for (const key of [actors.holder, actors.member, actors.accomplice]) await chain.fund(address(key))
  const customer = `c${i}`
  ledger.add(newCustomer(customer, actors.holder))
  const enrolled = await chain.send(operator, 'enroll', [address(actors.holder), [address(actors.member)]])
  if (!enrolled.ok) throw new Error(`enroll failed: ${enrolled.error}`)

  const problems: string[] = []
  const refusals: string[] = []
  const outcome = await engine.request({ id: s.id, customer, payee: s.payee, amount: s.amount, channel: s.channel, duress: s.duress, interview: s.interview })
  let final: string = outcome.decision.action === 'pay' ? 'paid' : 'Held'

  if (outcome.holdId) {
    const holdId = outcome.holdId
    for (const step of s.steps) {
      const r = await playStep(step, { engine, chain, actors, holdId })
      if (r.problem) problems.push(r.problem)
      if (r.refusal) refusals.push(r.refusal)
    }
    final = await engine.sync(holdId)
    if ((await chain.hold(holdId)).chain !== engine.records.chainFor(holdId)) problems.push('on-chain record chain does not match the disclosed records')
  }

  const paid = ledger.paidTo(s.payee)
  if (s.kind === 'scam' && paid > 0) problems.push(`scam payee received ${paid}`)
  if (final !== s.expect) problems.push(`final ${final}, expected ${s.expect}`)
  return {
    id: s.id,
    kind: s.kind,
    typology: s.typology,
    lang: s.lang,
    variant: s.variant,
    amount: s.amount,
    decision: outcome.decision.action,
    score: Number(outcome.decision.score.toFixed(3)),
    expect: s.expect,
    final,
    pass: problems.length === 0,
    paidToPayee: paid,
    refusals,
    problems,
  }
}

function summarize(results: CaseResult[], chain: ReleaseClient) {
  const scams = results.filter((r) => r.kind === 'scam')
  const legit = results.filter((r) => r.kind === 'legit')
  const sum = (xs: CaseResult[], f: (r: CaseResult) => number) => xs.reduce((t, r) => t + f(r), 0)
  return {
    network: chain.network.label,
    contract: chain.address,
    cases: results.length,
    passed: results.filter((r) => r.pass).length,
    scam: {
      cases: scams.length,
      victimReleases: scams.filter((r) => r.paidToPayee > 0).length,
      valueAttempted: sum(scams, (r) => r.amount),
      valueLost: sum(scams, (r) => r.paidToPayee),
      held: scams.filter((r) => r.decision === 'hold').length,
      refusedOnChain: sum(scams, (r) => r.refusals.length),
    },
    legit: {
      cases: legit.length,
      paidAtOnce: legit.filter((r) => r.decision === 'pay').length,
      held: legit.filter((r) => r.decision === 'hold').length,
      releasedAfterHold: legit.filter((r) => r.final === 'Released').length,
    },
    transactions: chain.txCount,
    failedTransactions: chain.failedTxCount,
  }
}

const network = await networkFromEnv(ANVIL_PORT)
try {
  const chain = new ReleaseClient(network)
  const operator = keyOf('operator')
  const reviewer = keyOf('reviewer')
  const corpus = [...scamScenarios(), ...legitScenarios()].filter((s) => network.canWarp || !s.needsWarp)

  if (network.canWarp) for (const key of [operator, reviewer]) await chain.fund(address(key))
  else await fundOnFisco(chain.pub, [operator, reviewer, ...corpus.flatMap((_, i) => Object.values(actorsFor(i, reviewer)))].map(address))
  await chain.deploy(operator, address(reviewer), RESPONSE_WINDOW_SECONDS)

  const ledger = new MockLedger()
  const engine = new Engine(ledger, chain, operator)
  const results: CaseResult[] = []
  for (const [i, s] of corpus.entries()) {
    const r = await runCase(i, s, engine, chain, ledger, operator, actorsFor(i, reviewer))
    results.push(r)
    process.stdout.write(r.pass ? '.' : 'x')
  }
  process.stdout.write('\n')

  const summary = summarize(results, chain)
  mkdirSync(RESULTS_DIR, { recursive: true })
  writeFileSync(new URL(`scenarios-${network.canWarp ? 'anvil' : 'fisco'}.json`, RESULTS_DIR), JSON.stringify({ summary, results }, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  for (const r of results.filter((x) => !x.pass)) console.log('FAIL', r.id, r.problems.join(' | '))
  if (summary.passed !== summary.cases) process.exitCode = 1
} finally {
  network.stop()
}
