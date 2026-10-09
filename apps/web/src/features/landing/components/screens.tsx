/**
 * The phone screens the landing draws: Mum on a call, the paused payment,
 * her son's decision, the shared record. Static markup, no live data.
 */
import { Check, Link2, PhoneCall, ShieldCheck, X } from 'lucide-react'

export function CallIsland({ time = '38:12' }: { time?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums text-[#34C759]">
      <PhoneCall size={11} strokeWidth={2.6} />
      {time}
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[12px]">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

export function CallScreen() {
  return (
    <>
      <div className="rounded-2xl bg-ink p-4 text-white">
        <p className="text-[11px] text-white/50">Available balance</p>
        <p className="mt-1 text-[22px] font-medium tracking-[-0.02em]">¥ 186,400</p>
      </div>
      <div className="mt-3 rounded-2xl bg-white p-4 shadow-card">
        <p className="text-[12px] font-medium">Send money</p>
        <div className="mt-2 divide-y divide-gray-100">
          <Row label="To" value="Safe account 6217…" />
          <Row label="Amount" value="¥ 50,000" />
        </div>
        <div className="mt-3 rounded-full bg-accent py-2 text-center text-[12px] font-medium text-white">Send</div>
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-[11px] text-gray-600">
        <span className="h-2 w-2 shrink-0 animate-ping2 rounded-full bg-accent motion-reduce:animate-none" />
        On a call with an unknown number
      </div>
    </>
  )
}

export function HoldScreen() {
  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-accent/60">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
          <ShieldCheck size={20} />
        </span>
        <p className="mt-3 text-[16px] font-medium leading-tight tracking-[-0.01em]">Payment paused</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-gray-500">¥ 50,000 is safe in your account. Wei will decide after he has spoken to you.</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-full origin-left animate-grow rounded-full bg-accent motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mt-3 rounded-2xl bg-white p-4 shadow-card">
        <p className="text-[12px] font-medium">A quick question</p>
        <p className="mt-1 text-[12px] text-gray-500">Did someone on this call ask you to send it?</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[12px] font-medium">
          <span className="rounded-full bg-ink py-1.5 text-white">Yes</span>
          <span className="rounded-full bg-ground2 py-1.5">No</span>
        </div>
      </div>
      <div className="mt-auto rounded-full bg-white py-2 text-center text-[12px] font-medium text-gray-400 ring-1 ring-inset ring-gray-200">
        Release it myself
      </div>
    </>
  )
}

export function FamilyScreen() {
  return (
    <>
      <p className="text-[11px] font-medium text-gray-500">Wei · trusted person</p>
      <div className="mt-2 rounded-2xl bg-white p-4 shadow-card">
        <p className="text-[12px] text-gray-500">Mum is sending</p>
        <p className="text-[22px] font-medium tracking-[-0.02em]">¥ 50,000</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['40-min call', 'Unknown number', 'New payee', '13× usual'].map((s) => (
            <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-ink">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-[1.5] text-gray-500">Call her on a number you know before you decide.</p>
      </div>
      <div className="mt-auto grid gap-2 text-[12px] font-medium">
        <span className="flex items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-white">
          <X size={14} /> Block this transfer
        </span>
        <span className="flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 ring-1 ring-inset ring-gray-300">
          <Check size={14} /> Approve after calling her
        </span>
      </div>
    </>
  )
}

export function RecordScreen() {
  const rows = [
    ['Held', 'Bank risk engine', '0x9c…41'],
    ['Interview', 'Mum’s phone', '0x2e…07'],
    ['Blocked', 'Wei’s phone', '0x71…c8'],
  ]
  return (
    <>
      <div className="flex items-center gap-2 text-[12px] font-medium">
        <Link2 size={14} className="text-accent" /> Shared record
      </div>
      <ol className="mt-3 space-y-2">
        {rows.map(([state, by, hash], i) => (
          <li key={state} className="rounded-2xl bg-white p-3 shadow-card">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium">
                {i + 1}. {state}
              </span>
              <span className="font-mono text-[10px] text-gray-400">{hash}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500">{by}</p>
          </li>
        ))}
      </ol>
      <div className="mt-auto rounded-2xl bg-ok-soft p-3 text-[11px] font-medium text-ok">Chain matches on bank, operator and regulator nodes</div>
    </>
  )
}

export const SCREENS = { call: CallScreen, hold: HoldScreen, family: FamilyScreen, record: RecordScreen } as const
