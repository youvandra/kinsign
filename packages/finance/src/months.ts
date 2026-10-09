/** Calendar helpers. Months are keyed in UTC so a statement reads the same on every server. */

export const DAY = 86_400_000

export const monthOf = (at: number): string => new Date(at).toISOString().slice(0, 7)

export function monthStart(month: string): number {
  return Date.parse(`${month}-01T00:00:00Z`)
}

export function daysIn(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** The month `n` months before `month`. */
export function shift(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 - n, 1)).toISOString().slice(0, 7)
}

export const dayOfMonth = (at: number): number => new Date(at).getUTCDate()

export const round = (n: number, to = 1): number => Math.round(n / to) * to
