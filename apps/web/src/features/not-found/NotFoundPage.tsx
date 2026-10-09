import { ArrowLink } from '@/components/ui'
import { useTitle } from '@/lib/hooks'

export default function NotFoundPage() {
  useTitle('Not found · Kinsign')
  return (
    <main className="grid min-h-[80vh] place-items-center bg-ground px-5 pt-24 text-center">
      <div>
        <p className="text-[13px] font-medium text-accent">404</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.6rem)] font-medium tracking-[-0.04em]">This page is not here.</h1>
        <p className="mx-auto mt-4 max-w-[40ch] text-gray-600">The address may be mistyped, or the page may have moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ArrowLink text="Go home" to="/" />
          <ArrowLink text="Read the docs" to="/docs" variant="light" />
        </div>
      </div>
    </main>
  )
}
