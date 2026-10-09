import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router'
import { ToastHost } from '@/components/ui'
import LanguageProvider from './LanguageProvider'
import { router } from './router'

export default function App() {
  return (
    <LanguageProvider>
      <MotionConfig reducedMotion="user">
        <ToastHost>
          <RouterProvider router={router} />
        </ToastHost>
      </MotionConfig>
    </LanguageProvider>
  )
}
