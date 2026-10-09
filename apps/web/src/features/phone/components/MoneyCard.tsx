import type { Category, Insight } from '@kinsign/protocol'
import { PiggyBank, PieChart } from 'lucide-react'
import type { Lang, Strings } from '@/i18n'
import { yuan } from '@/lib/format'
import type { FinanceSession } from '../useFinance'

const SHOWN_CATEGORIES = 4
const SHOWN_TIPS = 3
const SHADES = ['bg-ink', 'bg-accent', 'bg-gray-400', 'bg-gray-300', 'bg-gray-200']

/**
 * Where her money went this month, her budgets and what to look at. Every
 * action is prepared for her: a budget is set by her tap, and a transfer to
 * savings becomes an assistant draft she still has to confirm.
 */
export default function MoneyCard({ finance, onPrepare, t, lang }: { finance: FinanceSession; onPrepare: (text: string) => void; t: Strings; lang: Lang }) {
  const { view, busy, setBudget } = finance
  if (!view) return null
  const { summary, budgets, insights } = view
  const cats = summary.byCategory
  const top = cats.slice(0, SHOWN_CATEGORIES)
  const rest = cats.slice(SHOWN_CATEGORIES).reduce((s, c) => s + c.amount, 0)
  const parts: { key: Category | 'rest'; label: string; amount: number }[] = [
    ...top.map((c) => ({ key: c.category, label: t.cat[c.category], amount: c.amount })),
    ...(rest > 0 ? [{ key: 'rest' as const, label: t.cat.other, amount: rest }] : []),
  ]
  const total = Math.max(1, summary.spending)

  const act = (i: Insight) => {
    if (i.action?.kind === 'setBudget') void setBudget(i.action.category, i.action.limit, t.moneyBudgetSet)
    else if (i.action?.kind === 'draftTransfer') onPrepare(t.moneyAskSave(i.action.amount))
  }

  return (
    <section className="mt-4 rounded-[22px] bg-white p-[18px] shadow-card" aria-label={t.money}>
      <header className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-ground2 text-ink">
          <PieChart size={16} />
        </span>
        <p className="text-[16px] font-semibold tracking-[-0.01em]">{t.money}</p>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[12px] text-gray-500">{t.moneySpent}</p>
          <p className="text-[22px] font-medium tabular-nums tracking-[-0.02em]">{yuan(summary.spending, lang)}</p>
        </div>
        <div>
          <p className="text-[12px] text-gray-500">{t.moneyLeft}</p>
          <p className={`text-[22px] font-medium tabular-nums tracking-[-0.02em] ${summary.net < 0 ? 'text-accent' : ''}`}>{yuan(summary.net, lang)}</p>
        </div>
      </div>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-ground2" aria-hidden="true">
        {parts.map((p, i) => (
          <span key={p.key} className={SHADES[i]} style={{ width: `${(p.amount / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
        {parts.map((p, i) => (
          <li key={p.key} className="flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className={`h-2 w-2 shrink-0 rounded-full ${SHADES[i]}`} />
            <span className="truncate">{p.label}</span>
            <span className="ml-auto tabular-nums text-ink">{yuan(p.amount, lang)}</span>
          </li>
        ))}
      </ul>

      {budgets.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-medium text-gray-500">{t.moneyBudgets}</p>
          <ul className="mt-2 space-y-2.5">
            {budgets.map((b) => (
              <li key={b.category}>
                <div className="flex justify-between text-[13px]">
                  <span>{t.cat[b.category]}</span>
                  <span className="tabular-nums text-gray-600">{t.moneyOfLimit(yuan(b.spent, lang), yuan(b.limit, lang))}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ground2">
                  <span
                    className={`block h-full rounded-full ${b.status === 'ok' ? 'bg-ink' : 'bg-accent'}`}
                    style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className="text-[12px] font-medium text-gray-500">{t.moneyTips}</p>
        {insights.length === 0 ? (
          <p className="mt-1.5 text-[13px] text-gray-500">{t.moneyNone}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {insights.slice(0, SHOWN_TIPS).map((i) => (
              <li key={i.id} className="rounded-2xl bg-ground2 p-3">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${i.severity === 'act' ? 'bg-accent' : i.severity === 'watch' ? 'bg-ink' : 'bg-gray-400'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium leading-[1.35]">{i.title}</p>
                    <p className="mt-0.5 text-[12px] leading-[1.45] text-gray-600">{i.detail}</p>
                    {i.action && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(i)}
                        className="mt-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-medium ring-1 ring-inset ring-gray-200 disabled:opacity-40"
                      >
                        {i.action.kind === 'draftTransfer' && <PiggyBank size={13} />}
                        {i.action.kind === 'setBudget' ? t.moneySetBudget(yuan(i.action.limit, lang)) : t.moneySave(yuan(i.action.amount, lang))}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
