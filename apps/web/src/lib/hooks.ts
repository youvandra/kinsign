import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Polls `load` every `ms`. Re-renders only when the JSON of the result
 * changes, so polling never disturbs what the user is doing.
 */
export function usePoll<T>(load: () => Promise<T>, ms = 2500): [T | undefined, () => Promise<void>] {
  const [data, setData] = useState<T>()
  const last = useRef('')
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })
  const refresh = useCallback(async () => {
    try {
      const next = await loadRef.current()
      const key = JSON.stringify(next)
      if (key !== last.current) {
        last.current = key
        setData(next)
      }
    } catch {
      // keep the last good data; the next poll retries
    }
  }, [])
  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), ms)
    return () => clearInterval(id)
  }, [refresh, ms])
  return [data, refresh]
}

/** Current time in ms, ticking every `ms`. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const mq = matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export const WIDE_QUERY = '(min-width: 1024px)'

/**
 * False while the page is hidden. Browsers stop animation frames in hidden
 * pages, so anything animated while hidden would stall half-way; callers use
 * this to place elements at their final state instead of animating.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}

/** Motion props for an entrance: animated when the page is visible, final at once when not. */
export function useEntrance<T extends object>(from: T): { initial: T | false } {
  const visible = usePageVisible()
  return { initial: visible ? from : false }
}

/** True once the page has scrolled past `offset` pixels. */
export function useScrolled(offset = 0): boolean {
  const [scrolled, setScrolled] = useState(() => window.scrollY > offset)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}

/** Sets the document title while the page is mounted. */
export function useTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
