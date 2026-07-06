import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  fullScreenOnMobile?: boolean
}

export function Modal({ open, onClose, title, children, className, fullScreenOnMobile }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={cn("fixed inset-0 z-[100] grid place-items-center", fullScreenOnMobile ? "p-0 md:p-4" : "p-4")}>
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full bg-card border border-line shadow-pop animate-fade-in flex flex-col',
        fullScreenOnMobile ? 'h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[var(--rad-card)]' : 'max-h-[90vh] rounded-[var(--rad-card)]',
        className || 'max-w-lg'
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="text-subtle hover:text-fg transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}
