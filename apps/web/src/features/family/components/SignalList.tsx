import type { Signal } from './signals'

export default function SignalList({ signals }: { signals: readonly Signal[] }) {
  return (
    <ul className="mt-4">
      {signals.map(({ icon: Icon, text, calm }) => (
        <li key={text} className="grid grid-cols-[28px_1fr] items-center gap-3 border-t border-gray-100 py-2.5 text-[14px] text-gray-700 first:border-t-0">
          <span className={`grid h-7 w-7 place-items-center rounded-full ${calm ? 'bg-ground2 text-gray-500' : 'bg-accent-soft text-accent-ink'}`}>
            <Icon size={14} />
          </span>
          {text}
        </li>
      ))}
    </ul>
  )
}
