import { Check } from 'lucide-react'
import React from 'react'
import { cn } from '../../lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    onCheckedChange?: (checked: boolean) => void
    checked?: boolean
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, checked, onChange, disabled, ...props }, ref) => {
        return (
            <div className="relative inline-flex items-center justify-center">
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => {
                        onChange?.(e)
                        onCheckedChange?.(e.target.checked)
                    }}
                    className={cn(
                        'peer h-4 w-4 shrink-0 appearance-none rounded-[3px] border border-line bg-surface transition-colors cursor-pointer',
                        'hover:border-line-strong',
                        'checked:bg-primary checked:border-primary',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                        'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface2',
                        className
                    )}
                    {...props}
                />
                <Check
                    size={12}
                    strokeWidth={3}
                    className={cn(
                        'pointer-events-none absolute hidden text-primary-fg peer-checked:block',
                        disabled && 'opacity-60'
                    )}
                />
            </div>
        )
    }
)
Checkbox.displayName = 'Checkbox'
