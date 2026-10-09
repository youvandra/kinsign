import { Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { clock } from '@/lib/format'
import { useMedia, useNow, WIDE_QUERY } from '@/lib/hooks'

/** The page runs inside the stage's device frame (`?embed`). */
export const isEmbedded = () => new URLSearchParams(location.search).has('embed')

function Battery() {
  return (
    <svg viewBox="0 0 28 13" className="h-[12px] w-[26px]" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
      <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
      <path d="M25.5 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

function Signal() {
  return (
    <svg viewBox="0 0 18 12" className="h-[11px] w-[17px]" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  )
}

/** Call state shown in the dynamic island: a green timer, as iOS does during a call. */
export interface IslandCall {
  since: number // ms timestamp the call started
  sharing?: boolean
}

function StatusBar({ call }: { call?: IslandCall | null }) {
  const now = useNow()
  const t = new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="relative z-30 flex h-[50px] shrink-0 items-center justify-between px-7 pt-3 text-[15px] font-semibold text-ink">
      <span className="tabular-nums">{t}</span>
      <div
        className={`absolute left-1/2 top-[11px] flex h-[36px] -translate-x-1/2 items-center justify-between gap-3 rounded-[22px] bg-black px-3 text-[13px] font-semibold text-white transition-[min-width] duration-500 ease-sheet ${call ? 'min-w-[196px]' : 'min-w-[124px]'}`}
      >
        {call && (
          <>
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#34c759]">
              <Phone size={12} fill="white" strokeWidth={0} />
            </span>
            <span className="tabular-nums text-[#34c759]">
              {clock((now - call.since) / 1000)}
              {call.sharing && <span className="ml-1.5 text-accent">⧉</span>}
            </span>
          </>
        )}
      </div>
      <span className="flex items-center gap-1.5">
        <Signal />
        <Battery />
      </span>
    </div>
  )
}

function MobileCallBar({ call }: { call: IslandCall }) {
  const now = useNow()
  return (
    <div className="mb-3 flex items-center gap-2 rounded-full bg-[#e7f6ec] px-4 py-2 text-[13px] font-medium text-[#1d6b37]">
      <Phone size={14} /> <span className="tabular-nums">{clock((now - call.since) / 1000)}</span>
    </div>
  )
}

/**
 * An iPhone frame on wide screens; a plain rounded panel on narrow ones; the
 * full window, with a status bar, when embedded in the stage.
 */
export default function DeviceFrame({
  children,
  call,
  overlay,
  embed = false,
}: {
  children: ReactNode
  call?: IslandCall | null
  overlay?: ReactNode
  embed?: boolean
}) {
  const wide = useMedia(WIDE_QUERY)
  if (embed) {
    return (
      <div className="relative flex h-screen flex-col overflow-hidden bg-ground">
        <StatusBar call={call} />
        <div className="flex-1 overflow-y-auto px-[18px] pb-10 pt-2 [scrollbar-width:none]">{children}</div>
        {overlay}
        <div className="absolute bottom-2 left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded bg-ink/85" />
      </div>
    )
  }
  if (wide) {
    return (
      <div className="mx-auto w-[390px] rounded-[56px] bg-[#0b0b0c] p-3 shadow-device ring-[1.5px] ring-inset ring-[#2a2a2c]">
        <div className="relative flex h-[800px] flex-col overflow-hidden rounded-[44px] bg-ground">
          <StatusBar call={call} />
          <div className="flex-1 overflow-y-auto px-[18px] pb-10 pt-2 [scrollbar-width:none]">{children}</div>
          {overlay}
          <div className="absolute bottom-2 left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded bg-ink/85" />
        </div>
      </div>
    )
  }
  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      {call && <MobileCallBar call={call} />}
      {children}
      {overlay}
    </div>
  )
}
