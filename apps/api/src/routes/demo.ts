/**
 * Demo-only controls for the bank's side: move time, escalate to the review
 * desk, let the desk decide, and hand out the demo device links.
 */
import { API } from '@kinsign/protocol'
import type { Bank } from '../bank.ts'
import { DEMO_KEYS, demoLinks } from '../demo.ts'
import { HttpError, type Router } from '../http/router.ts'
import { boolean, hex32, number, object } from '../http/validate.ts'

const REVIEW_WINDOW_SKIP_SECONDS = 31 * 60

export function demoRoutes(router: Router, bank: Bank): void {
  const requireWarp = () => {
    if (!bank.chain.network.canWarp) throw new HttpError(409, 'this chain cannot move time')
  }

  router
    .get(API.links, async () => demoLinks())

    .post(API.escalate, async (raw) => {
      const holdId = hex32(object(raw), 'holdId')
      bank.requireHold(holdId)
      if (bank.chain.network.canWarp) await bank.chain.warp(REVIEW_WINDOW_SKIP_SECONDS)
      return bank.engine.escalate(holdId)
    })

    .post(API.review, async (raw) => {
      const b = object(raw)
      const holdId = hex32(b, 'holdId')
      bank.requireHold(holdId)
      const approve = boolean(b, 'approve')
      const result = await bank.engine.review(holdId, DEMO_KEYS.reviewer, approve, approve ? 'customer confirmed by call-back' : 'scam confirmed at call-back')
      await bank.engine.sync(holdId)
      return result
    })

    .post(API.warp, async (raw) => {
      requireWarp()
      await bank.chain.warp(Math.round(number(object(raw), 'hours', { min: 0, max: 24 * 30 }) * 3600))
      return { ok: true }
    })
}
