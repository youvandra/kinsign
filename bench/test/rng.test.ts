import { describe, expect, it } from 'vitest'
import { Rng } from '../src/population/rng.ts'

describe('Rng', () => {
  it('is reproducible from its seed', () => {
    const a = new Rng(42)
    const b = new Rng(42)
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()))
  })

  it('stays in [0, 1)', () => {
    const r = new Rng(7)
    for (let i = 0; i < 10_000; i++) {
      const x = r.next()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})
