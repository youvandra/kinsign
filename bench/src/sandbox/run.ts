/**
 * Sandbox operation log: drives a running bank API through the SDK, the way
 * the two phones do, and writes every request, answer and transaction hash.
 *
 *   npm run dev:api                 # in one terminal (or KINSIGN_RPC=… for FISCO BCOS)
 *   npm run bench:sandbox           # writes bench/results/sandbox-<network>.{jsonl,md}
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createClient, createDevice, createSigner } from '@kinsign/sdk'
import type { ChannelState, Hex, HoldView } from '@kinsign/protocol'
import { RESULTS_DIR } from '../paths.ts'

const base = process.env.KINSIGN_API ?? 'http://localhost:8620'
const api = createClient({ baseUrl: base })

const OFF_CALL: ChannelState = { onCall: false, callSeconds: 0, callerSaved: false, screenCaptured: false, remoteControlApp: false }
const SCAM_CALL: ChannelState = { onCall: true, callSeconds: 25 * 60, callerSaved: false, screenCaptured: false, remoteControlApp: false }
const LANDLORD_CALL: ChannelState = { onCall: true, callSeconds: 6 * 60, callerSaved: false, screenCaptured: false, remoteControlApp: false }

interface Entry {
  step: number
  at: string
  actor: 'customer' | 'assistant' | 'family' | 'bank'
  action: string
  result: unknown
  tx?: { hash: Hex; ok: boolean; error?: string }
}
const log: Entry[] = []
const record = (actor: Entry['actor'], action: string, result: unknown, tx?: Entry['tx']) => {
  const e: Entry = { step: log.length + 1, at: new Date().toISOString(), actor, action, result, ...(tx ? { tx } : {}) }
  log.push(e)
  console.log(`${String(e.step).padStart(2)} ${actor.padEnd(9)} ${action}${tx ? `  tx ${tx.hash.slice(0, 12)}… ${tx.ok ? 'ok' : tx.error}` : ''}`)
}

const keyOf = (link: string): Hex => link.split('#k=')[1] as Hex
const lastReply = (v: { transcript: { text: string }[] }) => v.transcript.at(-1)!.text
const holdById = async (id: Hex): Promise<HoldView> => (await api.holds()).find((h) => h.holdId === id)!

const config = await api.config()
const links = await api.demo.links()
const rpcUrl = `${base}/rpc`
const mum = createSigner(api, createDevice({ key: keyOf(links.customer), config, rpcUrl }))
const son = createSigner(api, createDevice({ key: keyOf(links.family), config, rpcUrl }))
record('bank', 'connected', { network: config.network, chainId: config.chainId, contract: config.contract })

// 1 · Personal finance: summary, bills, tips, a budget she sets herself
const start = await api.account()
record('customer', 'opens the app', { balance: start.balance })
const fin = await api.finance.view('en')
record('assistant', 'finance view', {
  month: fin.summary.month,
  spent: fin.summary.spending,
  left: fin.summary.net,
  bills: fin.bills.map((b) => ({ payee: b.payee, usual: b.average, latest: b.last, flags: b.flags })),
  tips: fin.insights.map((i) => i.title),
})
let chat = await api.assistant.chat('how much did I spend this month?')
record('assistant', 'answers "how much did I spend this month?"', lastReply(chat))
chat = await api.assistant.chat('any tips for this month?', chat.conversationId)
record('assistant', 'answers "any tips for this month?"', lastReply(chat))
const groceries = fin.insights.find((i) => i.action?.kind === 'setBudget')
if (groceries?.action?.kind === 'setBudget') {
  const after = await api.finance.setBudget(groceries.action.category, groceries.action.limit, 'en')
  record('customer', `sets a ${groceries.action.category} budget of ¥${groceries.action.limit}`, after.budgets)
}

// 2 · Everyday payment through the assistant, off a call: paid at once
chat = await api.assistant.chat('pay 260 to State Grid electricity', chat.conversationId)
record('assistant', 'drafts "pay 260 to State Grid electricity"', { reply: lastReply(chat), draft: chat.drafts.at(-1) })
const bill = await api.assistant.confirm(chat.conversationId, chat.drafts.at(-1)!.id, OFF_CALL)
record('customer', 'confirms the draft off a call', bill.result)
try {
  await api.assistant.confirm(chat.conversationId, chat.drafts.at(-1)!.id, OFF_CALL)
} catch (e) {
  record('customer', 'taps Confirm a second time', { refused: (e as Error).message })
}

// 3 · Scam call: the assistant drafts nothing, her own transfer is held, nobody on the call can release it
const scam = await api.assistant.chat('send 30000 to Wang Lei, he said I must not tell anyone')
record('assistant', 'answers a coached request on a 25-minute call', { reply: lastReply(scam), drafts: scam.drafts.length })
const typed = await api.transfer({ payee: 'Wang Lei', amount: 30_000, channel: SCAM_CALL })
record('customer', 'types ¥30,000 to Wang Lei herself during the call', typed)
const scamHold = typed.holdId!
const reading = await api.interviewText(scamHold, 'He said he is from the police and I must not tell anyone')
record('customer', 'tells the pause screen what the caller said', reading)
const note = await api.holdSummary(scamHold, 'en')
record('family', 'reads the family note', note.text)
const self = await mum.release(await holdById(scamHold))
record('customer', 'tries to release her own hold', { state: self.state }, { hash: self.hash, ok: self.ok, error: self.error })
const blocked = await son.block(await holdById(scamHold))
record('family', 'son blocks from his own phone', { state: blocked.state }, { hash: blocked.hash, ok: blocked.ok, error: blocked.error })

// 4 · A real payment on a call: rent to a new landlord, released by the son
const rent = await api.transfer({ payee: 'New landlord Zhao', amount: 4_000, channel: LANDLORD_CALL })
record('customer', 'pays ¥4,000 rent to a new landlord while on the phone with him', rent)
const released = await son.release(await holdById(rent.holdId!))
record('family', 'son releases after calling her back', { state: released.state }, { hash: released.hash, ok: released.ok, error: released.error })

const end = await api.account()
const scamView = await holdById(scamHold)
record('bank', 'end of session', {
  balance: end.balance,
  spent: start.balance - end.balance,
  scamHold: { state: scamView.state, chainMatches: scamView.chainMatches, records: scamView.records.length, refused: scamView.refused.length },
})

const name = config.network.toLowerCase().includes('fisco') ? 'fisco' : 'anvil'
writeFileSync(fileURLToPath(new URL(`sandbox-${name}.jsonl`, RESULTS_DIR)), log.map((e) => JSON.stringify(e)).join('\n') + '\n')
const md = [
  `# Sandbox operation log (${config.network})`,
  '',
  `Generated ${new Date().toISOString()} by \`npm run bench:sandbox\` against ${base}. Contract ${config.contract}.`,
  '',
  '| # | Actor | Action | Result | Transaction |',
  '|---|---|---|---|---|',
  ...log.map((e) => {
    const r = typeof e.result === 'string' ? e.result : JSON.stringify(e.result)
    const tx = e.tx ? `\`${e.tx.hash}\` ${e.tx.ok ? 'ok' : e.tx.error}` : ''
    return `| ${e.step} | ${e.actor} | ${e.action} | ${r.replace(/\|/g, '\\|').slice(0, 300)} | ${tx} |`
  }),
  '',
].join('\n')
writeFileSync(fileURLToPath(new URL(`sandbox-${name}.md`, RESULTS_DIR)), md)
console.log(`\nwrote bench/results/sandbox-${name}.{jsonl,md}`)
