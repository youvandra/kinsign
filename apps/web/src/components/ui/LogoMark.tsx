/** The mark (two overlapping signatures) and the wordmark. */
export default function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full bg-ink ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="9" cy="12" r="5.5" stroke="white" />
        <circle cx="15" cy="12" r="5.5" stroke="#F26522" />
      </svg>
    </span>
  )
}
