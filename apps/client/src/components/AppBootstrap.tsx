import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { getPublicKey } from '../crypto/publicKey.service'
import { User } from '@veolms/shared'

let authBootstrapPromise: Promise<{ accessToken: string; user: User }> | null = null
const PAYLOAD_ENCRYPTION_ENABLED = import.meta.env.VITE_ENABLE_PAYLOAD_ENCRYPTION === undefined
  ? import.meta.env.PROD
  : import.meta.env.VITE_ENABLE_PAYLOAD_ENCRYPTION === 'true'

function shouldAttemptRefresh() {
  const hasRefreshHint = document.cookie.split(';').some((part) => part.trim().startsWith('hasRefreshToken='))
  const protectedPrefixes = ['/dashboard', '/my-courses', '/profile', '/admin']
  return hasRefreshHint || protectedPrefixes.some((prefix) => window.location.pathname.startsWith(prefix))
}

function clearRefreshHint() {
  document.cookie = 'hasRefreshToken=; Max-Age=0; path=/'
}

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, finishAuthCheck } = useAuthStore()

  useEffect(() => {
    let active = true
    const tokenAtStart = useAuthStore.getState().accessToken

    if (!shouldAttemptRefresh()) {
      finishAuthCheck()
      return () => {
        active = false
      }
    }

    authBootstrapPromise ||= (async () => {
      const { data } = await api.post('/auth/refresh', {})
      const accessToken = data.data.accessToken
      const me = await api.get<{ data: User }>('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      return { accessToken, user: me.data.data }
    })()

    authBootstrapPromise
      .then(({ accessToken, user }) => {
        if (!active) return
        const currentToken = useAuthStore.getState().accessToken
        if (currentToken && currentToken !== tokenAtStart && currentToken !== accessToken) {
          return
        }
        setAuth(user, accessToken)
      })
      .catch((error) => {
        if (error?.response?.status === 401) clearRefreshHint()
        if (active) finishAuthCheck()
      })
      .finally(() => {
        authBootstrapPromise = null
        if (active) finishAuthCheck()
      })

    return () => {
      active = false
    }
  }, [setAuth, finishAuthCheck])

  useEffect(() => {
    if (!PAYLOAD_ENCRYPTION_ENABLED) return
    const warmPublicKey = () => {
      void getPublicKey().catch(() => undefined)
    }
    const requestIdle = window.requestIdleCallback || ((cb: IdleRequestCallback) => window.setTimeout(cb, 1))
    const cancelIdle = window.cancelIdleCallback || window.clearTimeout
    const idleId = requestIdle(warmPublicKey)
    return () => cancelIdle(idleId)
  }, [])

  return <>{children}</>
}
