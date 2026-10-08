/** What a customer's phone and a family device read, and the customer's transfer request. */
import { API } from '@kinsign/protocol'
import type { Bank } from '../bank.ts'
import type { Router } from '../http/router.ts'
import { boolean, channel, hex32, interviewYeses, number, object, string } from '../http/validate.ts'
import { accountView, configView, holdViews, proposalsView } from '../views.ts'

const MAX_TRANSFER = 10_000_000

export function bankRoutes(router: Router, bank: Bank): void {
  router
    .get(API.config, async () => configView(bank))
    .get(API.account, async () => accountView(bank))
    .get(API.holds, () => holdViews(bank))
    .get(API.proposals, () => proposalsView(bank))

    // The phone asks to send money; the bank's policy decides pay or hold.
    .post(API.transfer, async (raw) => {
      const b = object(raw)
      return bank.transfer(
        string(b, 'payee', 80),
        number(b, 'amount', { min: 1, max: MAX_TRANSFER }),
        channel(b.channel),
        interviewYeses(b.interview),
        boolean(b, 'duress'),
      )
    })

    // On-screen answers during a call. Only "yes" answers are kept and attested (I3).
    .post(API.interview, async (raw) => {
      const b = object(raw)
      const holdId = hex32(b, 'holdId')
      bank.requireHold(holdId)
      return bank.engine.attest(holdId, 'interview', interviewYeses(b.answers))
    })
}
