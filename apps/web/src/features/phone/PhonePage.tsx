import { DeviceFrame, isEmbedded } from '@/components/device'
import { LangSelect, NavPill } from '@/components/ui'
import Director from '@/features/director/Director'
import { useT } from '@/i18n'
import { useMedia, useTitle, WIDE_QUERY } from '@/lib/hooks'
import AssistantCard from './components/AssistantCard'
import BalanceCard from './components/BalanceCard'
import MoneyCard from './components/MoneyCard'
import PhoneSheet from './components/PhoneSheet'
import QuickActions from './components/QuickActions'
import RecentFeed from './components/RecentFeed'
import SendForm from './components/SendForm'
import { useAssistant } from './useAssistant'
import { useFinance } from './useFinance'
import { usePhoneSession } from './usePhoneSession'

/** Mum's phone: a banking app in an iPhone frame, with the director beside it. */
export default function PhonePage() {
  const embed = isEmbedded()
  const wide = useMedia(WIDE_QUERY)
  const { t, lang } = useT()
  useTitle(`Kinsign · ${t.appPhone}`)
  const session = usePhoneSession()
  const assistant = useAssistant(session.transfers)
  const { account, feed, call, callSince, form, busy, actions } = session
  const finance = useFinance(lang, account?.balance)
  const island = call.onCall && callSince ? { since: callSince, sharing: call.screenCaptured } : null

  const app = (
    <div className="pb-6">
      <p className="mt-1 text-[13px] text-gray-500">{t.greeting}</p>
      <p className="text-[22px] font-medium tracking-[-0.02em]">{t.mum}</p>
      <BalanceCard balance={account?.balance} t={t} lang={lang} />
      <QuickActions t={t} />
      <AssistantCard session={assistant} t={t} lang={lang} />
      <MoneyCard finance={finance} onPrepare={(text) => void assistant.ask(text)} t={t} lang={lang} />
      <SendForm
        t={t}
        payee={form.payee}
        amount={form.amount}
        knownPayees={account?.knownPayees ?? []}
        sending={busy === 'send'}
        onPayee={form.setPayee}
        onAmount={form.setAmount}
        onSend={actions.send}
      />
      <RecentFeed rows={feed} t={t} lang={lang} />
    </div>
  )
  const sheet = <PhoneSheet session={session} contained={!embed && wide} />

  if (embed)
    return (
      <DeviceFrame embed call={island} overlay={sheet}>
        {app}
      </DeviceFrame>
    )

  return (
    <div className="min-h-screen">
      <NavPill title={t.appPhone} right={<LangSelect />} note={session.cfg ? <span>{session.cfg.network}</span> : undefined} />
      <main className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-20 pt-4 sm:px-8 lg:grid-cols-[1fr_400px] lg:gap-12 lg:px-12">
        <DeviceFrame call={island} overlay={sheet}>
          {app}
        </DeviceFrame>
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Director />
        </aside>
      </main>
    </div>
  )
}
