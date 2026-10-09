import { Badge, LangSelect, NavPill } from '@/components/ui'
import Director from '@/features/director/Director'
import { useT } from '@/i18n'
import { api } from '@/lib/api'
import { usePoll, useTitle } from '@/lib/hooks'

function Frame({ src, n, label }: { src?: string; n: string; label: string }) {
  return (
    <figure className="m-0 grid justify-items-center gap-4">
      <figcaption>
        <Badge n={n} label={label} />
      </figcaption>
      <div className="w-[390px] max-w-full rounded-[56px] bg-[#0b0b0c] p-3 shadow-device ring-[1.5px] ring-inset ring-[#2a2a2c]">
        <div className="h-[800px] overflow-hidden rounded-[44px] bg-ground">
          {src && <iframe title={label} src={src} className="block h-full w-full border-0" />}
        </div>
      </div>
    </figure>
  )
}

/** The same demo link, opened inside a frame (`?embed`), fragment key kept. */
const embedded = (link?: string) => {
  if (!link) return undefined
  const [path, hash] = link.split('#')
  return `${path}?embed=1${hash ? `#${hash}` : ''}`
}

/** Both devices side by side with the director, for live demos and the video. */
export default function StagePage() {
  const { t } = useT()
  useTitle(`Kinsign · ${t.appStage}`)
  const [links] = usePoll(api.demo.links, 60_000)
  return (
    <div className="min-h-screen">
      <NavPill title={t.appStage} right={<LangSelect />} />
      <main className="mx-auto grid max-w-[1600px] items-start gap-10 px-5 pb-20 pt-6 sm:px-8 xl:grid-cols-[1fr_1fr_380px] lg:px-12">
        <Frame src={embedded(links?.customer)} n="1" label={t.appPhone} />
        <Frame src={embedded(links?.family)} n="2" label={t.appFamily} />
        <aside className="w-full max-w-[480px] justify-self-center xl:sticky xl:top-4">
          <Director onStage />
        </aside>
      </main>
    </div>
  )
}
