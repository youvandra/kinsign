/**
 * The assistant's rules when no model is configured. They cover the demo's
 * paths in three languages and keep every guarantee of the model-backed
 * assistant: drafts only, scam warnings, no money moved.
 */
import type { InterviewAnswers, Lang } from '@kinsign/protocol'

const AMOUNT = /(?:¥|rmb|cny|yuan|元)?\s*(\d[\d,.]*)\s*(?:¥|rmb|cny|yuan|元|块)?/i

const PAY_WORDS = /\b(pay|send|transfer|bayar|kirim|transfer)\b|付|转|汇/i
const BALANCE_WORDS = /\b(balance|saldo|how much)\b|余额|多少钱/i
const SPENDING_WORDS = /\b(spend|spent|spending|expenses?|pengeluaran|habis|belanja bulan)\b|花了|支出|消费|开销/i
const BILL_WORDS = /\b(bills?|tagihan)\b|账单|缴费/i
const TIP_WORDS = /\b(tips?|advice|advise|recommend\w*|insights?|budget|save|saving|saran|anggaran|hemat|nabung)\b|建议|预算|省钱|储蓄/i
const PRESSURE: Record<keyof InterviewAnswers, RegExp> = {
  askedBySomeoneOnCall:
    /\b(police|officer|caller|he said|she said|they said|on the phone|told me to|polisi|petugas|katanya|disuruh|di telepon)\b|警察|公安|对方|电话里|让我|叫我/i,
  toldToKeepSecret: /\b(secret|tell no one|(?:not|n't|never)\s+(?:to\s+)?tell|rahasia|jangan (?:bilang|cerita|kasih tahu))\b|保密|不要告诉|别告诉|不能告诉/i,
  promisedReturnOrThreatened:
    /\b(arrest|jail|fine|refund|prize|reward|return it|safe account|ditangkap|penjara|denda|hadiah|dikembalikan|rekening aman)\b|逮捕|坐牢|罚款|退款|奖金|返还|安全账户/i,
}

/** "yes" answers found in the customer's own words. Absent keys mean nothing was found. */
export function readPressure(text: string): InterviewAnswers {
  const out: InterviewAnswers = {}
  for (const key of Object.keys(PRESSURE) as (keyof InterviewAnswers)[]) if (PRESSURE[key].test(text)) out[key] = true
  return out
}

export const looksCoerced = (text: string) => Object.keys(readPressure(text)).length > 0

export type OfflineIntent =
  | { kind: 'balance' }
  | { kind: 'draft'; payee: string; amount: number }
  | { kind: 'scam' }
  | { kind: 'spending' }
  | { kind: 'bills' }
  | { kind: 'tips' }
  | { kind: 'help' }

/** "pay 320 to Electricity Co." / "bayar 320 ke PLN" / "给张伟转500" */
export function offlineIntent(text: string): OfflineIntent {
  if (looksCoerced(text)) return { kind: 'scam' }
  if (TIP_WORDS.test(text) && !PAY_WORDS.test(text)) return { kind: 'tips' }
  if (BILL_WORDS.test(text) && !PAY_WORDS.test(text)) return { kind: 'bills' }
  if (SPENDING_WORDS.test(text) && !PAY_WORDS.test(text)) return { kind: 'spending' }
  if (BALANCE_WORDS.test(text) && !PAY_WORDS.test(text)) return { kind: 'balance' }
  if (PAY_WORDS.test(text)) {
    const amount = Number((text.match(AMOUNT)?.[1] ?? '').replace(/,/g, ''))
    const payee =
      text
        .match(/\b(?:to|ke|untuk)\s+(.+?)(?:\s+(?:for|untuk|buat)\b|[,!?]|$)/i)?.[1]
        ?.replace(/\.+$/, '')
        .trim() ??
      text.match(/给(.+?)(?:转|付|汇)/)?.[1]?.trim() ??
      ''
    if (payee && amount > 0) return { kind: 'draft', payee, amount }
  }
  return { kind: 'help' }
}

type ReplyKey = 'balance' | 'draft' | 'scam' | 'help' | 'spending' | 'bills' | 'tips' | 'noTips'

export const OFFLINE_REPLIES: Record<Lang, Record<ReplyKey, (a?: string, b?: string, c?: string) => string>> = {
  en: {
    balance: (b) => `Your balance is ${b}.`,
    draft: (amount, payee) => `I prepared ${amount} to ${payee}. Check it on screen and press Confirm when it looks right.`,
    scam: () =>
      'This sounds like a scam: real police and banks never ask you to move money or keep it secret. Please hang up and call your son on his usual number. I have not prepared any payment.',
    help: () =>
      'I can check your balance and spending, look over your bills, suggest a budget, or prepare a payment, for example: "pay 260 to State Grid electricity"',
    spending: (spent, left, top) =>
      `This month you have spent ${spent} so far and have ${left} left from your income.${top ? ` The biggest part is ${top}.` : ''}`,
    bills: (count, flagged) => `You have ${count} regular bills.${flagged ? ` Worth a look: ${flagged}.` : ' Nothing unusual this month.'}`,
    tips: (list) => `Here is what I would look at: ${list}`,
    noTips: () => 'Your spending looks steady this month. Nothing needs your attention.',
  },
  zh: {
    balance: (b) => `您的余额是 ${b}。`,
    draft: (amount, payee) => `已为您准备好向${payee}转账 ${amount}。请在屏幕上核对，确认无误后点“确认”。`,
    scam: () => '这很像诈骗：真正的警察和银行不会让您转账，也不会要求保密。请先挂断电话，用常用号码打给您儿子。我没有准备任何转账。',
    help: () => '我可以帮您查余额和支出、检查账单、建议预算，或准备付款，例如：“给 Grandson Wei 转 500”。',
    spending: (spent, left, top) => `本月到目前为止您已支出${spent}，收入还剩${left}。${top ? `花得最多的是${top}。` : ''}`,
    bills: (count, flagged) => `您有${count}笔固定账单。${flagged ? `值得注意：${flagged}。` : '本月没有异常。'}`,
    tips: (list) => `我建议您看看这几点：${list}`,
    noTips: () => '本月支出很平稳，没有需要您处理的事项。',
  },
  id: {
    balance: (b) => `Saldo Anda ${b}.`,
    draft: (amount, payee) => `Saya sudah siapkan ${amount} ke ${payee}. Cek di layar, lalu tekan Konfirmasi kalau sudah benar.`,
    scam: () =>
      'Ini terdengar seperti penipuan: polisi dan bank asli tidak pernah menyuruh memindahkan uang atau merahasiakannya. Tutup teleponnya dan hubungi anak Anda di nomor biasanya. Saya tidak menyiapkan pembayaran apa pun.',
    help: () =>
      'Saya bisa cek saldo dan pengeluaran, memeriksa tagihan, menyarankan anggaran, atau menyiapkan pembayaran, misalnya: "bayar 260 ke State Grid electricity".',
    spending: (spent, left, top) =>
      `Bulan ini Anda sudah mengeluarkan ${spent} dan masih tersisa ${left} dari pemasukan.${top ? ` Paling banyak untuk ${top}.` : ''}`,
    bills: (count, flagged) => `Anda punya ${count} tagihan rutin.${flagged ? ` Perlu dicek: ${flagged}.` : ' Tidak ada yang aneh bulan ini.'}`,
    tips: (list) => `Ini yang saya sarankan: ${list}`,
    noTips: () => 'Pengeluaran bulan ini stabil. Tidak ada yang perlu Anda tindak lanjuti.',
  },
}
