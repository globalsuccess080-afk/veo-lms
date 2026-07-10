import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeToaster } from './components/ui/ThemeToaster'
import { AppAlert } from './components/ui/AppAlert'
import { CustomScrollbar } from './components/shared/CustomScrollbar'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import { initTheme } from './store/themeStore'
import { AppBootstrap } from './components/AppBootstrap'
import { SocketProvider } from './providers/SocketProvider'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import './styles/globals.css'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AppBootstrap>
          <RouterProvider router={router} />
        </AppBootstrap>
      </SocketProvider>
      <ThemeToaster />
      <AppAlert />
      <CustomScrollbar />
      <PWAUpdatePrompt />
    </QueryClientProvider>
  </StrictMode>
)
