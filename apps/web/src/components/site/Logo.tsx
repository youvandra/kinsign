import { Link } from 'react-router'
import { Wordmark } from '@/components/ui'

export default function Logo({ suffix, dark = false }: { suffix?: string; dark?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Kinsign home">
      <Wordmark className="h-[28px]" dark={dark} />
      {suffix && <span className={`truncate text-[15px] ${dark ? 'text-white/50' : 'text-gray-500'}`}>{suffix}</span>}
    </Link>
  )
}
