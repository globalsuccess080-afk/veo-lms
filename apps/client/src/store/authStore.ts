import { User, Role } from '@veolms/shared'
import { create } from 'zustand'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  setToken: (token: string) => void
  logout: () => void
  isAdmin: () => boolean
  isStudent: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  setToken: (accessToken) => set((state) => ({ accessToken, isAuthenticated: !!accessToken && !!state.user })),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  isAdmin: () => get().user?.role === 'admin',
  isStudent: () => get().user?.role === 'student'
}))
