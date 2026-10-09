import { LOCALES, useT, type Lang } from '@/i18n'

/** Pill-shaped language picker; the choice carries into the stage's frames. */
export function LangSelect({ dark = true }: { dark?: boolean }) {
  const { lang, setLang } = useT()
  return (
    <div className="relative">
      <select
        aria-label="Language"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className={`min-h-[40px] cursor-pointer appearance-none rounded-full py-2 pl-4 pr-8 text-[13px] font-medium outline-none ${dark ? 'bg-ink text-white' : 'bg-ground2 text-ink'}`}
      >
        {(Object.keys(LOCALES) as Lang[]).map((l) => (
          <option key={l} value={l}>
            {LOCALES[l].langName}
          </option>
        ))}
      </select>
      <svg
        className={`pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 ${dark ? 'text-white' : 'text-ink'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
