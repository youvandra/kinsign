import { Link } from 'react-router'
import { LogoMark } from '@/components/ui'

export default function Logo({ suffix, dark = false }: { suffix?: string; dark?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Kinsign home">
      <LogoMark />
      <span className={`truncate text-[15px] font-semibold tracking-[-0.01em] ${dark ? 'text-white' : 'text-ink'}`}>
        Kinsign
        {suffix && <span className={`ml-2 font-normal ${dark ? 'text-white/50' : 'text-gray-500'}`}>{suffix}</span>}
      </span>
    </Link>
  )
}
