import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const base =
    'w-full bg-surface text-fg placeholder:text-subtle border rounded-[var(--rad-input)] px-3.5 transition-colors text-sm ' +
    'border-line hover:border-line-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface2'

interface WithError {
    error?: string
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & WithError>(
    ({ className, error, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                base,
                'h-12 md:h-11',
                error && 'border-danger ring-1 ring-danger/20 hover:border-danger',
                className
            )}
            {...props}
        />
    )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & WithError>(
    ({ className, error, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(
                base,
                'py-3 md:py-2.5 min-h-[120px] md:min-h-24 resize-y',
                error && 'border-danger ring-1 ring-danger/20 hover:border-danger',
                className
            )}
            {...props}
        />
    )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & WithError>(
    ({ className, error, children, ...props }, ref) => (
        <select
            ref={ref}
            className={cn(
                base,
                'h-12 md:h-11 cursor-pointer',
                error && 'border-danger ring-1 ring-danger/20 hover:border-danger',
                className
            )}
            {...props}
        >
            {children}
        </select>
    )
)
Select.displayName = 'Select'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn('block text-sm font-medium text-muted mb-1.5', className)} {...props} />
}

export function Field({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            {label && <Label>{label}</Label>}
            {children}
            {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
        </div>
    )
}
