import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Accent = 'violet' | 'indigo' | 'blue' | 'cyan' | 'green' | 'amber' | 'rose'
export type RadiusVariant = 'round' | 'sharp'

interface ThemeState {
  mode: ThemeMode
  accent: Accent
  radiusVariant: RadiusVariant
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: Accent) => void
  setRadiusVariant: (variant: RadiusVariant) => void
}

const STORAGE_KEY = 'veolms-theme'

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

function apply(mode: ThemeMode, accent: Accent, radius: RadiusVariant) {
  const root = document.documentElement
  const resolved = resolveMode(mode)
  root.setAttribute('data-mode', resolved)
  root.setAttribute('data-accent', accent)
  root.setAttribute('data-radius', radius)
  root.style.colorScheme = resolved
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      accent: 'violet',
      radiusVariant: 'round',
      setMode: (mode) => {
        apply(mode, get().accent, get().radiusVariant)
        set({ mode })
      },
      setAccent: (accent) => {
        apply(get().mode, accent, get().radiusVariant)
        set({ accent })
      },
      setRadiusVariant: (radiusVariant) => {
        apply(get().mode, get().accent, radiusVariant)
        set({ radiusVariant })
      }
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.mode, state.accent, state.radiusVariant)
      }
    }
  )
)

export function initTheme() {
  let mode: ThemeMode = 'system'
  let accent: Accent = 'violet'
  let radius: RadiusVariant = 'round'

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      mode = parsed.state?.mode ?? mode
      accent = parsed.state?.accent ?? accent
      radius = parsed.state?.radiusVariant ?? radius
    } catch {}
  }

  apply(mode, accent, radius)

  // Live-update when in system mode and OS preference changes
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useThemeStore.getState()
    if (current.mode === 'system') {
      apply('system', current.accent, current.radiusVariant)
    }
  })
}
