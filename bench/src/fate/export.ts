/**
 * Writes the triggered transfers to CSV for the FATE job. The bank file holds
 * the bank's features and the label; the operator file holds its view of the
 * call, only for customers on a federated operator, plus calls that never
 * reached the bank (so PSI has something to hide). Only triggered transfers
 * are scored, so only they are exported. Even rows train, odd rows test.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fateDataDir } from '../paths.ts'
import { generatePopulation, type Item } from '../population/generate.ts'
import { OPERATOR_SETTING } from '../population/params.ts'
import type { Rng } from '../population/rng.ts'

const BANK_COLUMNS = ['on_channel', 'new_payee', 'log_ratio', 'above_norm', 'flagged', 'call_min_device', 'screen', 'remote', 'caller_saved']
const OPERATOR_COLUMNS = ['call_active', 'international', 'number_age_log', 'scam_reports', 'targets_24h', 'roaming', 'call_min_network']
/** Operator calls with no bank transfer, as a share of the exported rows. */
const DECOY_SHARE = 0.5

const bit = (b: boolean) => (b ? 1 : 0)

function bankRow(i: Item): string {
  const f = i.f
  return [
    i.id,
    bit(i.kind === 'scam'),
    bit(f.onChannel),
    bit(f.newPayee),
    Math.log10(Math.max(f.amountRatio, 1e-3)).toFixed(4),
    bit(f.aboveNorm),
    bit(f.flaggedPayee),
    (f.callSeconds / 60).toFixed(2),
    bit(f.screenCaptured),
    bit(f.remoteControlApp),
    bit(f.callerSaved),
  ].join(',')
}

function operatorRow(i: Item): string {
  const o = i.op
  return [
    i.id,
    o.callActive,
    o.international,
    o.numberAgeDaysLog.toFixed(4),
    o.scamReports,
    o.distinctTargets24h,
    o.roaming,
    o.networkCallMinutes.toFixed(2),
  ].join(',')
}

function decoyRow(id: string, rng: Rng): string {
  return [id, 1, bit(rng.next() < 0.05), (2 + rng.next() * 2).toFixed(4), 0, Math.round(1 + rng.next() * 6), 0, (rng.next() * 10).toFixed(2)].join(',')
}

const { items, rng } = generatePopulation()
const dir = fateDataDir(OPERATOR_SETTING)
mkdirSync(dir, { recursive: true })

// The shuffle uses the population's own generator, so the split is reproducible and mixes both kinds.
const triggered = rng.shuffle(items.filter((i) => i.trig))
for (const split of ['train', 'test'] as const) {
  const rows = triggered.filter((_, k) => (k % 2 === 0) === (split === 'train'))
  const bank = [['id', 'y', ...BANK_COLUMNS].join(','), ...rows.map(bankRow)]
  const operator = [['id', ...OPERATOR_COLUMNS].join(','), ...rows.filter((i) => i.covered).map(operatorRow)]
  const decoys = Math.round(rows.length * DECOY_SHARE)
  for (let d = 0; d < decoys; d++) operator.push(decoyRow(`op-${split}-${d}`, rng))
  writeFileSync(new URL(`bank_${split}.csv`, dir), bank.join('\n') + '\n')
  writeFileSync(new URL(`operator_${split}.csv`, dir), operator.join('\n') + '\n')
  console.log(`${split}: bank ${rows.length} rows (${rows.filter((i) => i.kind === 'scam').length} scam), operator ${operator.length - 1} rows`)
}
