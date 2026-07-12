import { User, Role } from '@veolms/shared'
import { create } from 'zustand'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  authChecked: boolean
  setAuth: (user: User, token: string) => void
  setToken: (token: string) => void
  finishAuthCheck: () => void
  logout: () => void
  isAdmin: () => boolean
  isStudent: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authChecked: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, authChecked: true }),
  setToken: (accessToken) => set((state) => ({ accessToken, isAuthenticated: !!accessToken && !!state.user })),
  finishAuthCheck: () => set({ authChecked: true }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false, authChecked: true }),
  isAdmin: () => get().user?.role === 'admin',
  isStudent: () => get().user?.role === 'student'
}))
