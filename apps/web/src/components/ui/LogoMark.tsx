/** The mark: the orange "k" on its own, for square spots such as avatars and the favicon. */
export default function LogoMark({ className = 'h-9 w-9', tone = 'orange' }: { className?: string; tone?: 'orange' | 'ink' | 'white' }) {
  const src = tone === 'orange' ? '/brand/kinsign-mark.png' : `/brand/kinsign-mark-${tone}.png`
  return (
    <span className={`grid shrink-0 place-items-center ${className}`} aria-hidden="true">
      <img src={src} alt="" className="h-[86%] w-auto" draggable={false} />
    </span>
  )
}

/** The full logo: the mark as the "k", then "insign". `dark` picks the white wordmark for ink grounds. */
export function Wordmark({ className = 'h-7', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <img src={dark ? '/brand/kinsign-logo-white.png' : '/brand/kinsign-logo.png'} alt="Kinsign" className={`w-auto shrink-0 ${className}`} draggable={false} />
  )
}
