import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import RootLayout from './layouts/RootLayout'
import SiteLayout from './layouts/SiteLayout'

const RELOADED = 'kinsign:chunk-reload'

/**
 * A page open across a deploy asks for chunks the new build no longer has.
 * Reload once to pick up the new build; a second failure is a real error.
 */
async function loadFresh<T>(load: () => Promise<T>): Promise<T> {
  try {
    const module = await load()
    try {
      sessionStorage.removeItem(RELOADED)
    } catch {
      // storage can be unavailable; the reload guard is best effort
    }
    return module
  } catch (error) {
    let reloaded = true
    try {
      reloaded = sessionStorage.getItem(RELOADED) === '1'
      if (!reloaded) sessionStorage.setItem(RELOADED, '1')
    } catch {
      // without storage, never reload, so a broken build cannot loop
    }
    if (!reloaded) {
      location.reload()
      return new Promise<T>(() => {})
    }
    throw error
  }
}

/** Turns a page module's default export into a route's lazy component, so each page ships its own code. */
const page =
  (load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] =>
  async () => ({ Component: (await loadFresh(load)).default })

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    HydrateFallback: () => <div className="min-h-screen bg-ground" />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { index: true, lazy: page(() => import('@/features/landing/LandingPage')) },
          { path: 'benchmarks', lazy: page(() => import('@/features/benchmarks/BenchmarksPage')) },
        ],
      },
      {
        path: 'docs',
        lazy: page(() => import('@/features/docs/DocsLayout')),
        children: [
          { index: true, element: <Navigate to="/docs/introduction" replace /> },
          { path: '*', lazy: page(() => import('@/features/docs/DocsPage')) },
        ],
      },
      { path: 'phone', lazy: page(() => import('@/features/phone/PhonePage')) },
      { path: 'family', lazy: page(() => import('@/features/family/FamilyPage')) },
      { path: 'stage', lazy: page(() => import('@/features/stage/StagePage')) },
      {
        element: <SiteLayout />,
        children: [{ path: '*', lazy: page(() => import('@/features/not-found/NotFoundPage')) }],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
