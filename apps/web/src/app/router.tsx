import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import RootLayout from './layouts/RootLayout'
import SiteLayout from './layouts/SiteLayout'

/** Turns a page module's default export into a route's lazy component, so each page ships its own code. */
const page =
  (load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] =>
  async () => ({ Component: (await load()).default })

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    HydrateFallback: () => <div className="min-h-screen bg-ground" />,
    children: [
      {
        element: <SiteLayout />,
        children: [{ index: true, lazy: page(() => import('@/features/landing/LandingPage')) }],
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
