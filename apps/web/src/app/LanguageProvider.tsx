import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialLang, isLang, LangContext, LOCALES, rememberLang, type Lang } from '@/i18n'
import { useSceneChannel } from '@/lib/scene'

/** Holds the language; a change is remembered and carried to the stage's other frames. */
export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const post = useSceneChannel((m) => {
    if (m.type === 'lang' && isLang(m.lang)) setLangState(m.lang)
  })
  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next)
      rememberLang(next)
      post({ type: 'lang', lang: next })
    },
    [post],
  )
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang
  }, [lang])
  const value = useMemo(() => ({ lang, t: LOCALES[lang], setLang }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
