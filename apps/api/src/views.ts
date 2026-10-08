/** Maps bank state to the wire types in @kinsign/protocol. */
import type { AccountView, ConfigView, Hex, HoldView, ProposalsView, ProposalStatus } from '@kinsign/protocol'
import type { Bank } from './bank.ts'
import { addressOf, DEMO_CUSTOMER_ID, DEMO_KEYS } from './demo.ts'

const DECIDED = new Set(['Released', 'Blocked', 'Cancelled'])

export function configView(bank: Bank): ConfigView {
  const { network } = bank.chain
  return {
    chainId: network.chainId,
    contract: bank.chain.address,
    abi: bank.chain.abi,
    canWarp: network.canWarp,
    network: network.label,
    holder: bank.holder,
    members: [addressOf(DEMO_KEYS.son)],
  }
}

export function accountView(bank: Bank): AccountView {
  const customer = bank.ledger.get(DEMO_CUSTOMER_ID)
  return {
    balance: customer.balance,
    knownPayees: [...customer.knownPayees],
    reserved: bank.ledger.reservedTotal(),
    paid: bank.paid.slice(-10).reverse(),
  }
}

export async function holdView(bank: Bank, holdId: Hex): Promise<HoldView> {
  const meta = bank.requireHold(holdId)
  const onChain = await bank.chain.hold(holdId)
  const { records } = bank.engine
  return {
    holdId,
    at: meta.at,
    payee: meta.payee,
    amount: meta.amount,
    channel: meta.channel,
    score: meta.decision.score,
    reasons: meta.decision.reasons,
    features: {
      newPayee: meta.decision.features.newPayee,
      amountRatio: meta.decision.features.amountRatio,
      aboveNorm: meta.decision.features.aboveNorm,
    },
    state: onChain.state,
    decidedBy: DECIDED.has(onChain.state) ? onChain.decidedBy : null,
    transferDigest: onChain.transferDigest,
    chainHash: onChain.chain,
    chainMatches: onChain.chain === records.chainFor(holdId),
    records: records.forHold(holdId).map(({ kind, body, hash }) => ({ kind, body, hash })),
    refused: records.refusedForHold(holdId).map(({ kind, error, body }) => ({ kind, error, body })),
  }
}

export async function holdViews(bank: Bank): Promise<HoldView[]> {
  const views = await Promise.all([...bank.holds.keys()].map((id) => holdView(bank, id)))
  return views.sort((a, b) => b.at - a.at)
}

export async function proposalsView(bank: Bank): Promise<ProposalsView> {
  const now = await bank.chain.now()
  const colleague = addressOf(DEMO_KEYS.colleague).toLowerCase()
  const proposals = await Promise.all(
    (await bank.chain.proposals(bank.holder)).map(async ({ member }) => {
      const { effectiveAt, removedAt } = await bank.chain.circle(bank.holder, member)
      const status: ProposalStatus = removedAt !== 0 && removedAt <= now ? 'vetoed' : effectiveAt > now ? 'pending' : 'effective'
      return { member, effectiveAt, removedAt, status, label: member.toLowerCase() === colleague ? ('callerColleague' as const) : ('newPerson' as const) }
    }),
  )
  return { now, proposals }
}
