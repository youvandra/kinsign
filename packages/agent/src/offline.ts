/**
 * The assistant's rules when no model is configured. They cover the demo's
 * paths in three languages and keep every guarantee of the model-backed
 * assistant: drafts only, scam warnings, no money moved.
 */
import type { InterviewAnswers, Lang } from '@kinsign/protocol'

const AMOUNT = /(?:¥|rmb|cny|yuan|元)?\s*(\d[\d,.]*)\s*(?:¥|rmb|cny|yuan|元|块)?/i

const PAY_WORDS = /\b(pay|send|transfer|bayar|kirim|transfer)\b|付|转|汇/i
const BALANCE_WORDS = /\b(balance|saldo|how much)\b|余额|多少钱/i
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

export type OfflineIntent = { kind: 'balance' } | { kind: 'draft'; payee: string; amount: number } | { kind: 'scam' } | { kind: 'help' }

/** "pay 320 to Electricity Co." / "bayar 320 ke PLN" / "给张伟转500" */
export function offlineIntent(text: string): OfflineIntent {
  if (looksCoerced(text)) return { kind: 'scam' }
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

export const OFFLINE_REPLIES: Record<Lang, Record<'balance' | 'draft' | 'scam' | 'help', (a?: string, b?: string) => string>> = {
  en: {
    balance: (b) => `Your balance is ${b}.`,
    draft: (amount, payee) => `I prepared ${amount} to ${payee}. Check it on screen and press Confirm when it looks right.`,
    scam: () =>
      'This sounds like a scam: real police and banks never ask you to move money or keep it secret. Please hang up and call your son on his usual number. I have not prepared any payment.',
    help: () => 'I can check your balance or prepare a payment, for example: "pay 260 to State Grid electricity"',
  },
  zh: {
    balance: (b) => `您的余额是 ${b}。`,
    draft: (amount, payee) => `已为您准备好向${payee}转账 ${amount}。请在屏幕上核对，确认无误后点“确认”。`,
    scam: () => '这很像诈骗：真正的警察和银行不会让您转账，也不会要求保密。请先挂断电话，用常用号码打给您儿子。我没有准备任何转账。',
    help: () => '我可以帮您查余额或准备付款，例如：“给 Grandson Wei 转 500”。',
  },
  id: {
    balance: (b) => `Saldo Anda ${b}.`,
    draft: (amount, payee) => `Saya sudah siapkan ${amount} ke ${payee}. Cek di layar, lalu tekan Konfirmasi kalau sudah benar.`,
    scam: () =>
      'Ini terdengar seperti penipuan: polisi dan bank asli tidak pernah menyuruh memindahkan uang atau merahasiakannya. Tutup teleponnya dan hubungi anak Anda di nomor biasanya. Saya tidak menyiapkan pembayaran apa pun.',
    help: () => 'Saya bisa cek saldo atau menyiapkan pembayaran, misalnya: "bayar 260 ke State Grid electricity".',
  },
}
