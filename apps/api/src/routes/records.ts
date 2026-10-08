/**
 * Decisions signed on a device. The bank issues a salted record, the device
 * puts its hash in its own transaction, and the bank files the record by the
 * receipt and settles by the contract's state. The bank never signs for a device.
 */
import { API } from '@kinsign/protocol'
import type { Bank } from '../bank.ts'
import type { Router } from '../http/router.ts'
import { address, hex32, object, string } from '../http/validate.ts'

const DEVICE_RECORD_KINDS = new Set(['release', 'block', 'cancel'])

export function recordRoutes(router: Router, bank: Bank): void {
  router
    .post(API.record, async (raw) => {
      const b = object(raw)
      const holdId = hex32(b, 'holdId')
      bank.requireHold(holdId)
      const kind = string(b, 'kind', 20)
      if (!DEVICE_RECORD_KINDS.has(kind)) throw new Error(`kind must be one of ${[...DEVICE_RECORD_KINDS].join(', ')}`)
      const record = bank.engine.issueRecord(holdId, kind, { by: address(b, 'by') })
      return { recordHash: record.hash }
    })

    .post(API.sync, async (raw) => {
      const b = object(raw)
      const holdId = hex32(b, 'holdId')
      bank.requireHold(holdId)
      if (b.recordHash !== undefined && b.txHash !== undefined) {
        const receipt = await bank.chain.pub.getTransactionReceipt({ hash: hex32(b, 'txHash') })
        bank.engine.fileIssuedRecord(hex32(b, 'recordHash'), receipt.status === 'success')
      }
      return { state: await bank.engine.sync(holdId) }
    })
}
