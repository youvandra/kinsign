import { createContext, useContext } from 'react'
import { en, type Strings } from './locales/en'
import { id } from './locales/id'
import { zh } from './locales/zh'

export type { Strings }

export const LOCALES = { en, zh, id } as const
export type Lang = keyof typeof LOCALES

export const isLang = (value: unknown): value is Lang => typeof value === 'string' && value in LOCALES

const STORAGE_KEY = 'kinsign-lang'

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // storage blocked: fall through to the browser language
  }
  const browser = navigator.language.slice(0, 2)
  return isLang(browser) ? browser : 'en'
}

export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage blocked: the choice lasts for this page only
  }
}

export interface LangContextValue {
  lang: Lang
  t: Strings
  setLang: (lang: Lang) => void
}

export const LangContext = createContext<LangContextValue>({ lang: 'en', t: en, setLang: () => {} })
export const useT = () => useContext(LangContext)
