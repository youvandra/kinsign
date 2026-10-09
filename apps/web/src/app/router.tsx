import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import RootLayout from './layouts/RootLayout'

/** Turns a page module's default export into a route's lazy component, so each page ships its own code. */
const page =
  (load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] =>
  async () => ({ Component: (await load()).default })

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    HydrateFallback: () => <div className="min-h-screen bg-ground" />,
    children: [
      { path: 'phone', lazy: page(() => import('@/features/phone/PhonePage')) },
      { path: 'family', lazy: page(() => import('@/features/family/FamilyPage')) },
      { path: 'stage', lazy: page(() => import('@/features/stage/StagePage')) },
    ],
  },
]

export const router = createBrowserRouter(routes)
