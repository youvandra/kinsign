import type { ReactNode } from 'react'

/** Numbered section badge: dark circle plus outlined pill. */
export function Badge({ n, label, dark = false }: { n: ReactNode; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold sm:h-7 sm:w-7 sm:text-[12px] ${dark ? 'bg-white text-ink' : 'bg-ink text-white'}`}
      >
        {n}
      </span>
      <span
        className={`rounded-full border px-3 py-1 text-[12px] font-medium sm:px-4 sm:py-1.5 sm:text-[13px] ${dark ? 'border-white/25 text-white' : 'border-gray-300 text-ink'}`}
      >
        {label}
      </span>
    </div>
  )
}

const tone: Record<string, string> = {
  Held: 'border-accent text-accent-ink',
  Review: 'border-accent text-accent-ink',
  Released: 'border-gray-300 text-ink',
  Blocked: 'border-gray-300 text-gray-500',
  Cancelled: 'border-gray-300 text-gray-500',
}
const dot: Record<string, string> = {
  Held: 'bg-accent animate-ping2',
  Review: 'bg-accent animate-ping2',
  Released: 'bg-ok',
  Blocked: 'bg-gray-400',
  Cancelled: 'bg-gray-400',
}

export function Status({ state, label, onDark = false }: { state: string; label: string; onDark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-medium ${onDark ? 'border-white/30 text-white' : (tone[state] ?? 'border-gray-300')}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[state] ?? 'bg-gray-400'} motion-reduce:animate-none`} />
      {label}
    </span>
  )
}

export function LiveDot({ ok = false }: { ok?: boolean }) {
  return <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${ok ? 'bg-ok' : 'bg-accent animate-ping2'} motion-reduce:animate-none`} />
}

export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-gray-200 py-3 text-[14px] first:border-t-0">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300 ease-axion ${checked ? 'bg-accent' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-sheet ${checked ? 'translate-x-[18px]' : ''}`}
        />
      </button>
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | undefined
  options: { v: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex shrink-0 rounded-full bg-ground2 p-[3px]">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`min-h-[32px] rounded-full px-4 text-[13px] font-medium transition-colors duration-300 ease-axion ${value === o.v ? 'bg-ink text-white' : 'text-gray-600 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-card sm:p-6 ${className}`}>{children}</div>
}
