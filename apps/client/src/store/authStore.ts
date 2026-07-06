import { User, Role } from '@veolms/shared'
import { create } from 'zustand'

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, token: string) => void
  setToken: (token: string) => void
  logout: () => void
  isAdmin: () => boolean
  isStudent: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setToken: (accessToken) => set({ accessToken }),
  logout: () => set({ user: null, accessToken: null }),
  isAdmin: () => get().user?.role === 'admin',
  isStudent: () => get().user?.role === 'student'
}))
