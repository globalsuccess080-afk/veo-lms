import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../services/auth.service'
import { PageLoader } from './ui/Spinner'
const API = import.meta.env.VITE_API_URL || '/api'

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const { setToken, setAuth } = useAuthStore()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true })
        if (!active) return
        setToken(data.data.accessToken)
        const user = await getMe()
        if (active) setAuth(user, data.data.accessToken)
      } catch {
      } finally {
        if (active) setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [setToken, setAuth])

  if (!ready) {
    return <PageLoader />
  }

  return <>{children}</>
}
