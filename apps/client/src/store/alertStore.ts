import { create } from 'zustand'

export interface AlertOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
}

interface AlertState {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  danger: boolean
  onConfirm: (() => void) | null
  showAlert: (options: AlertOptions) => void
  closeAlert: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  open: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
  onConfirm: null,
  showAlert: (options) => set({
    open: true,
    ...options,
    confirmText: options.confirmText || 'Confirm',
    cancelText: options.cancelText || 'Cancel',
    danger: options.danger || false,
  }),
  closeAlert: () => set({ open: false, onConfirm: null })
}))
