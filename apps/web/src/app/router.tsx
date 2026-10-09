import { createBrowserRouter, type RouteObject } from 'react-router'
import RootLayout from './layouts/RootLayout'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    HydrateFallback: () => <div className="min-h-screen bg-ground" />,
    children: [],
  },
]

export const router = createBrowserRouter(routes)
