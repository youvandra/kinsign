/** Data and signed actions of a family member's device. */
import type { Hex, HoldView } from '@kinsign/protocol'
import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui'
import { useT } from '@/i18n'
import { api, isLive } from '@/lib/api'
import { usePoll } from '@/lib/hooks'
import { useSigner } from '@/lib/use-signer'

export function useFamily() {
  const { t } = useT()
  const toast = useToast()
  const [cfg] = usePoll(api.config, 60_000)
  const [holds, refreshHolds] = usePoll(api.holds, 2000)
  const [proposals, refreshProposals] = usePoll(api.proposals, 2500)
  const signer = useSigner('family', cfg)
  const [busy, setBusy] = useState(false)

  const run = useCallback(
    async (action: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
      setBusy(true)
      try {
        const r = await action()
        toast(r.ok ? success : String(r.error), r.ok ? 'ok' : 'warn')
      } catch (e) {
        toast((e as Error).message, 'warn')
      } finally {
        setBusy(false)
        void Promise.all([refreshHolds(), refreshProposals()])
      }
    },
    [toast, refreshHolds, refreshProposals],
  )

  const block = (h: HoldView) => signer && run(() => signer.block(h), t.blocked)
  const approve = (h: HoldView) => signer && run(() => signer.release(h), t.released)
  const veto = (member: Hex) => signer && cfg && run(() => signer.vetoMember(cfg.holder, member), t.vetoDone)

  return {
    holder: cfg?.holder,
    me: signer?.address,
    live: holds?.filter(isLive) ?? [],
    decided: holds?.filter((h) => !isLive(h)) ?? [],
    proposals: proposals?.proposals ?? [],
    chainNow: proposals?.now ?? 0,
    busy,
    actions: { block, approve, veto },
  }
}
