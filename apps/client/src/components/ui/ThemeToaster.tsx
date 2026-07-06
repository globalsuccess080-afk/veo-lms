import { Toaster } from 'sonner'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToaster() {
  const mode = useThemeStore((s) => s.mode)

  return (
    <Toaster
      position="top-right"
      theme={mode as 'light' | 'dark'}
      richColors
      closeButton
      toastOptions={{
        style: {
          '--normal-bg': 'var(--surface)',
          '--normal-border': 'var(--border)',
          '--normal-text': 'var(--fg)',
          '--success-bg': 'var(--primary-subtle)',
          '--success-border': 'color-mix(in srgb, var(--primary) 30%, transparent)',
          '--success-text': 'var(--primary)',
          '--error-bg': 'color-mix(in srgb, var(--danger) 10%, var(--surface))',
          '--error-border': 'color-mix(in srgb, var(--danger) 30%, transparent)',
          '--error-text': 'var(--danger)',
        } as React.CSSProperties
      }}
    />
  )
}
