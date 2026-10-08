/**
 * Seeded generator (mulberry32) with the few distributions the model needs.
 * The order of draws is part of the dataset: the FATE predictions are keyed to
 * items generated in exactly this order, so never reorder calls.
 */
export class Rng {
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Box–Muller; draws twice, radius first. */
  normal(): number {
    const radius = Math.sqrt(-2 * Math.log(1 - this.next()))
    return radius * Math.cos(2 * Math.PI * this.next())
  }

  lognormal(median: number, sigma: number): number {
    return median * Math.exp(sigma * this.normal())
  }

  bern(p: number): boolean {
    return this.next() < p
  }

  /** Exponential with the given mean. */
  exponential(mean: number): number {
    return -Math.log(1 - this.next()) * mean
  }

  /** In-place Fisher–Yates. */
  shuffle<T>(xs: T[]): T[] {
    for (let k = xs.length - 1; k > 0; k--) {
      const j = Math.floor(this.next() * (k + 1))
      ;[xs[k], xs[j]] = [xs[j]!, xs[k]!]
    }
    return xs
  }
}

export const POPULATION_SEED = 20261009
