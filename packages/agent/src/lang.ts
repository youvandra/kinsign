import type { Lang } from '@kinsign/protocol'

const INDONESIAN = /\b(saya|aku|bayar|kirim|saldo|tolong|ke|untuk|rekening|tagihan|berapa|apa|ya|tidak)\b/i

/** A cheap guess at the customer's language, for the offline replies. */
export function guessLang(text: string): Lang {
  if (/[一-鿿]/.test(text)) return 'zh'
  if (INDONESIAN.test(text)) return 'id'
  return 'en'
}
