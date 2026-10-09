import { Clapperboard, Clock3, Landmark, PhoneCall } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Pill, Switch, useToast } from '@/components/ui'
import { useT } from '@/i18n'
import { api, isLive } from '@/lib/api'
import { usePoll } from '@/lib/hooks'
import { NO_CALL, useSceneChannel, type CallState } from '@/lib/scene'
import { SCENES } from './scenes'

const HOURS_IN_TIMELOCK = 72

function Panel({ icon: Icon, title, children }: { icon?: typeof PhoneCall; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-[12px] font-medium text-gray-500">
        {Icon && <Icon size={14} />} {title}
      </p>
      {children}
    </section>
  )
}

/** Scenario, call and bank-side controls. Talks to the phone over the scene channel. */
export default function Director({ onStage = false }: { onStage?: boolean }) {
  const { t } = useT()
  const toast = useToast()
  const [call, setCall] = useState<CallState>(NO_CALL)
  const post = useSceneChannel((m) => {
    if (m.type === 'state') setCall(m.call)
  })
  const [cfg] = usePoll(api.config, 60_000)
  const [links] = usePoll(api.demo.links, 60_000)
  const [holds] = usePoll(api.holds, 2000)
  const live = holds?.find(isLive)

  const updateCall = (change: Partial<CallState>) => {
    const next = { ...call, ...change }
    setCall(next)
    post({ type: 'call', call: next })
  }
  const bank = (action: () => Promise<unknown>) => action().catch((e: Error) => toast(e.message, 'warn'))

  return (
    <div className="grid gap-3">
      <header className="mb-1 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white">
          <Clapperboard size={18} />
        </span>
        <div>
          <p className="text-[15px] font-medium">{t.director}</p>
          <p className="text-[13px] text-gray-500">{t.directorSub}</p>
        </div>
      </header>

      <Panel title={t.scenarios}>
        <div className="grid gap-2">
          {SCENES.map((scene) => (
            <button
              key={scene.key}
              type="button"
              onClick={() => {
                setCall(scene.call)
                post({ type: 'scene', payee: scene.payee, amount: scene.amount, call: scene.call })
              }}
              className="flex min-h-[60px] items-center justify-between gap-3 rounded-2xl bg-ground2 px-4 py-3 text-left transition-[background-color,transform] duration-300 ease-axion hover:bg-gray-200 active:scale-[0.99]"
            >
              <span className="grid gap-0.5">
                <span className="text-[14px] font-medium">{t.scenes[scene.key].title}</span>
                <span className="text-[12px] text-gray-500">{t.scenes[scene.key].sub}</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${scene.scam ? 'bg-accent-soft text-accent-ink' : 'bg-white text-gray-600'}`}
              >
                {scene.scam ? t.scam : t.legit}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel icon={PhoneCall} title={t.call}>
        <Switch label={t.onCallSw} checked={call.onCall} onChange={(onCall) => updateCall({ onCall, minutes: onCall ? Math.max(call.minutes, 1) : 0 })} />
        {call.onCall && (
          <div className="border-t border-gray-200 py-3">
            <div className="mb-2 flex justify-between text-[14px]">
              <span>{t.minutes}</span>
              <span className="tabular-nums text-gray-500">{call.minutes} min</span>
            </div>
            <input
              type="range"
              min={1}
              max={90}
              value={call.minutes}
              onChange={(e) => updateCall({ minutes: Number(e.target.value) })}
              className="w-full accent-accent"
              aria-label={t.minutes}
            />
          </div>
        )}
        {call.onCall && <Switch label={t.callerSaved} checked={call.callerSaved} onChange={(callerSaved) => updateCall({ callerSaved })} />}
        <Switch label={t.screenShare} checked={call.screenCaptured} onChange={(screenCaptured) => updateCall({ screenCaptured })} />
        <Switch label={t.remoteApp} checked={call.remoteControlApp} onChange={(remoteControlApp) => updateCall({ remoteControlApp })} />
        <Switch label={t.duressPin} checked={call.duress} onChange={(duress) => updateCall({ duress })} />
      </Panel>

      <Panel icon={Landmark} title={t.bank}>
        <div className="flex flex-wrap gap-2">
          {cfg?.canWarp && (
            <Pill disabled={live?.state !== 'Held'} onClick={() => live && bank(() => api.demo.escalate(live.holdId))}>
              <Clock3 size={14} /> {t.toReview}
            </Pill>
          )}
          <Pill disabled={live?.state !== 'Review'} onClick={() => live && bank(() => api.demo.review(live.holdId, true))}>
            {t.reviewApprove}
          </Pill>
          <Pill disabled={live?.state !== 'Review'} onClick={() => live && bank(() => api.demo.review(live.holdId, false))}>
            {t.reviewBlock}
          </Pill>
          {cfg?.canWarp && <Pill onClick={() => bank(() => api.demo.warp(HOURS_IN_TIMELOCK))}>{t.skip72}</Pill>}
        </div>
        {links && (
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-200 pt-4 text-[13px]">
            <a className="underline decoration-gray-300 underline-offset-4 hover:decoration-ink" href={links.family} target="_blank" rel="noopener">
              {t.openFamily}
            </a>
            {!onStage && (
              <a className="underline decoration-gray-300 underline-offset-4 hover:decoration-ink" href="/stage" target="_blank" rel="noopener">
                {t.openStage}
              </a>
            )}
          </nav>
        )}
      </Panel>
    </div>
  )
}
