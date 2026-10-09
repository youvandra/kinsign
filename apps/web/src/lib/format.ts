import type { Lang } from '@/i18n'

export const yuan = (n: number, lang: Lang = 'en') => `¥${Number(n).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 0 })}`

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

export const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export const timeOf = (ms: number, lang: Lang) =>
  new Date(ms).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : lang === 'id' ? 'id-ID' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
