/**
 * The note a trusted person reads before deciding on a hold, in their own
 * language. It is display text only: it changes no state and no score.
 */
import type { HoldView, Lang } from '@kinsign/protocol'
import { textOf, type ModelPort } from './model.ts'
import { SUMMARY_SYSTEM } from './prompts.ts'

type Facts = ReturnType<typeof factsOf>

export function factsOf(hold: HoldView) {
  // Each interview record's body is the answers it attested; together they are everything she said yes to.
  const answered: Record<string, boolean> = Object.assign({}, ...hold.records.filter((r) => r.kind === 'interview').map((r) => r.body as object))
  return {
    payee: hold.payee,
    amount: hold.amount,
    timesUsual: Math.round(hold.features.amountRatio * 10) / 10,
    newPayee: hold.features.newPayee,
    callMinutes: Math.round(hold.channel.callSeconds / 60),
    onCall: hold.channel.onCall,
    callerInContacts: hold.channel.callerSaved,
    screenShared: hold.channel.screenCaptured,
    remoteControl: hold.channel.remoteControlApp,
    answeredYes: Object.keys(answered).filter((k) => answered[k] === true),
    state: hold.state,
  }
}

const yuan = (n: number) => `¥${n.toLocaleString('en-US')}`

const ANSWERS: Record<Lang, Record<string, string>> = {
  en: {
    askedBySomeoneOnCall: 'someone on the call asked for it',
    toldToKeepSecret: 'she was told to keep it secret',
    promisedReturnOrThreatened: 'she was promised money or threatened',
  },
  zh: { askedBySomeoneOnCall: '通话中有人要求她付款', toldToKeepSecret: '有人让她保密', promisedReturnOrThreatened: '有人许诺返钱或威胁她' },
  id: {
    askedBySomeoneOnCall: 'ada orang di telepon yang memintanya',
    toldToKeepSecret: 'ia disuruh merahasiakannya',
    promisedReturnOrThreatened: 'ia dijanjikan uang atau diancam',
  },
}

/** The note without a model: the same facts in a fixed shape. */
export function templateSummary(f: Facts, lang: Lang): string {
  const said = f.answeredYes.map((k) => ANSWERS[lang][k]).filter(Boolean)
  if (lang === 'zh') {
    const call = f.onCall ? `她付款时正在通话 ${f.callMinutes} 分钟${f.callerInContacts ? '' : '，对方不在通讯录里'}。` : ''
    return `妈妈要向${f.payee}转 ${yuan(f.amount)}，是她平时金额的 ${f.timesUsual} 倍${f.newPayee ? '，而且是第一次给这个账户转账' : ''}。${call}${said.length ? `她回答：${said.join('；')}。` : ''}请先用您知道的号码给她打电话，再做决定。`
  }
  if (lang === 'id') {
    const call = f.onCall
      ? ` Saat mengirim, ia sedang di telepon selama ${f.callMinutes} menit${f.callerInContacts ? '' : ' dengan nomor yang tidak ada di kontaknya'}.`
      : ''
    return `Ibu ingin mengirim ${yuan(f.amount)} ke ${f.payee}, ${f.timesUsual}× jumlah biasanya${f.newPayee ? ', ke rekening yang baru pertama kali' : ''}.${call}${said.length ? ` Ia menjawab: ${said.join('; ')}.` : ''} Telepon ia dulu di nomor yang Anda kenal sebelum memutuskan.`
  }
  const call = f.onCall ? ` She was on a ${f.callMinutes}-minute call${f.callerInContacts ? '' : ' with a number outside her contacts'} when she sent it.` : ''
  return `Mum wants to send ${yuan(f.amount)} to ${f.payee}, ${f.timesUsual}× her usual amount${f.newPayee ? ', to an account she has never paid' : ''}.${call}${said.length ? ` She answered that ${said.join('; ')}.` : ''} Call her on a number you already know before you decide.`
}

export async function summarizeHold(hold: HoldView, lang: Lang, model: ModelPort | null): Promise<string> {
  const facts = factsOf(hold)
  if (!model) return templateSummary(facts, lang)
  const res = await model.create({
    system: SUMMARY_SYSTEM,
    messages: [{ role: 'user', content: `lang: ${lang}\n<hold_facts>${JSON.stringify(facts)}</hold_facts>` }],
    maxTokens: 1000,
  })
  const text = res.stop_reason === 'end_turn' ? textOf(res) : ''
  return text || templateSummary(facts, lang)
}
