import type { FormEvent } from 'react'
import { ArrowButton } from '@/components/ui'
import type { Strings } from '@/i18n'

const field =
  'mt-1.5 w-full rounded-full bg-ground2 px-[18px] py-[13px] text-[16px] text-ink outline-none ring-1 ring-inset ring-transparent transition-shadow duration-300 placeholder:text-gray-400 focus:ring-ink'

interface Props {
  t: Strings
  payee: string
  amount: string
  knownPayees: readonly string[]
  sending: boolean
  onPayee: (v: string) => void
  onAmount: (v: string) => void
  onSend: () => void
}

export default function SendForm({ t, payee, amount, knownPayees, sending, onPayee, onAmount, onSend }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSend()
  }
  return (
    <form onSubmit={submit} className="mt-4 rounded-[22px] bg-white p-[18px] shadow-card">
      <p className="text-[16px] font-semibold tracking-[-0.01em]">{t.sendMoney}</p>
      <p className="text-[12px] text-gray-500">{t.sendHint}</p>
      <label className="mt-3 block text-[12px] font-medium text-gray-500" htmlFor="payee">
        {t.payee}
      </label>
      <input id="payee" className={field} list="known-payees" autoComplete="off" value={payee} onChange={(e) => onPayee(e.target.value)} />
      <datalist id="known-payees">
        {knownPayees.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <label className="mt-3 block text-[12px] font-medium text-gray-500" htmlFor="amount">
        {t.amount}
      </label>
      <input id="amount" className={`${field} tabular-nums`} inputMode="numeric" value={amount} onChange={(e) => onAmount(e.target.value)} />
      <ArrowButton type="submit" className="mt-4" block size="lg" text={t.send} disabled={sending || !payee || !amount} />
    </form>
  )
}
