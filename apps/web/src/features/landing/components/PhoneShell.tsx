import type { ReactNode } from 'react'

/** A drawn phone: black bezel, dynamic island, light screen. Purely decorative. */
export default function PhoneShell({ children, island, className = '' }: { children: ReactNode; island?: ReactNode; className?: string }) {
  return (
    <div
      className={`relative aspect-[9/19] rounded-[44px] bg-[#0b0b0c] p-[9px] shadow-device ring-1 ring-inset ring-[#2a2a2c] ${className}`}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-[18px] z-10 flex h-[26px] min-w-[34%] -translate-x-1/2 items-center justify-center rounded-full bg-black px-3">
        {island}
      </div>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[36px] bg-ground px-4 pb-5 pt-14">{children}</div>
    </div>
  )
}
