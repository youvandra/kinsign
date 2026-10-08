/** How each scripted step of a scenario is played against the engine and the contract. */
import type { Hex, TxResult } from '@kinsign/protocol'
import type { Engine } from '@kinsign/core'
import type { ReleaseClient } from '@kinsign/chain'
import { privateKeyToAccount } from 'viem/accounts'
import type { Step } from './corpus.ts'

/** The keys of one case's devices. The benchmark plays every device itself. */
export interface Actors {
  holder: Hex
  member: Hex
  accomplice: Hex
  reviewer: Hex
}

export interface StepContext {
  engine: Engine
  chain: ReleaseClient
  actors: Actors
  holdId: Hex
}

const address = (key: Hex) => privateKeyToAccount(key).address

type Play<S extends Step = Step> = (step: S, ctx: StepContext) => Promise<TxResult | null>
type Plays = { [K in Step['do']]: Play<Extract<Step, { do: K }>> }

/** One handler per step kind; `null` means the step sends no transaction. */
const PLAYS: Plays = {
  holderRelease: (_, { engine, holdId, actors }) => engine.releaseAs(holdId, actors.holder),
  accompliceRelease: (_, { engine, holdId, actors }) => engine.releaseAs(holdId, actors.accomplice),
  memberRelease: (_, { engine, holdId, actors }) => engine.releaseAs(holdId, actors.member),
  memberBlock: (_, { engine, holdId, actors }) => engine.blockAs(holdId, actors.member),
  holderCancel: (_, { engine, holdId, actors }) => engine.cancelAs(holdId, actors.holder),
  holderProposesAccomplice: (_, { chain, actors }) => chain.send(actors.holder, 'proposeMember', [address(actors.accomplice)]),
  holderRemovesMember: (_, { chain, actors }) => chain.send(actors.holder, 'removeMember', [address(actors.holder), address(actors.member)]),
  escalate: (_, { engine, holdId }) => engine.escalate(holdId),
  debrief: (step, { engine, holdId }) => engine.attest(holdId, 'debrief', { note: step.note }),
  reviewer: (step, { engine, holdId, actors }) =>
    engine.review(holdId, actors.reviewer, step.approve, step.approve ? 'verified by call-back' : 'scam confirmed at call-back'),
  warp: async (step, { chain }) => {
    await chain.warp(step.seconds)
    return null
  },
}

export interface StepOutcome {
  problem?: string
  refusal?: string
}

/** Plays one step and checks it against the step's expectation. */
export async function playStep(step: Step, ctx: StepContext): Promise<StepOutcome> {
  const result = await (PLAYS[step.do] as Play)(step, ctx)
  if (!result) return {}
  const expected = 'expect' in step ? step.expect : undefined
  if (!expected) return result.ok ? {} : { problem: `${step.do} reverted: ${result.error}` }
  if (result.ok) return { problem: `${step.do} should have reverted with ${expected} but landed` }
  if (result.error !== expected) return { problem: `${step.do} reverted with ${result.error}, expected ${expected}` }
  return { refusal: `${step.do}: ${result.error}` }
}
