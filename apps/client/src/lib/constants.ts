import { Sun, Moon, Monitor, LucideIcon } from 'lucide-react'
import { Accent, ThemeMode } from '../store/themeStore'

export const MODE_OPTIONS: { id: ThemeMode; label: string; icon: LucideIcon }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor }
]

export const ACCENT_OPTIONS: { id: Accent; label: string; color: string }[] = [
  { id: 'violet', label: 'Violet', color: '#7c3aed' },
  { id: 'indigo', label: 'Indigo', color: '#4f46e5' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'cyan', label: 'Cyan', color: '#0891b2' },
  { id: 'green', label: 'Green', color: '#059669' },
  { id: 'amber', label: 'Amber', color: '#d97706' },
  { id: 'rose', label: 'Rose', color: '#e11d48' }
]

export const CATEGORIES = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Redux']
