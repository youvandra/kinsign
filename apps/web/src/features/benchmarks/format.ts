export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`

/** Yuan in millions with one decimal: 18.6 m. */
export const millions = (x: number) => `${(x / 1e6).toFixed(1)} m`

export const count = (x: number) => x.toLocaleString('en-US')

export const yuan = (x: number) => `¥${Math.round(x).toLocaleString('en-US')}`
