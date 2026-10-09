/**
 * The money card's data. It follows the account: when a payment goes through,
 * the summary, bills and tips are read again.
 */
import type { Category, FinanceView } from '@kinsign/protocol'
import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui'
import type { Lang } from '@/i18n'
import { api } from '@/lib/api'

export function useFinance(lang: Lang, version: unknown) {
  const toast = useToast()
  const [view, setView] = useState<FinanceView | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    api.finance
      .view(lang)
      .then((v) => live && setView(v))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [lang, version])

  const setBudget = useCallback(
    async (category: Category, limit: number, done: string) => {
      setBusy(true)
      try {
        setView(await api.finance.setBudget(category, limit, lang))
        toast(done, 'ok')
      } catch (e) {
        toast((e as Error).message, 'warn')
      } finally {
        setBusy(false)
      }
    },
    [lang, toast],
  )

  return { view, busy, setBudget }
}

export type FinanceSession = ReturnType<typeof useFinance>
