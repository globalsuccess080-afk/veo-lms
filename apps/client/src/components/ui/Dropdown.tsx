import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { cn } from '../../lib/utils'

export interface DropdownOption {
    value: string
    label: string
}

export interface DropdownProps {
    value: string | undefined
    onChange: (value: string) => void
    options: DropdownOption[]
    placeholder?: string
    className?: string
    error?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    searchable?: boolean
}

export function Dropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    className,
    error,
    disabled,
    size = 'md',
    searchable = options.length > 5
}: DropdownProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
    const ref = useClickOutside<HTMLDivElement>(() => {
        setOpen(false)
        setSearch('')
    })

    const selected = options.find((o) => o.value === value)

    const filteredOptions = searchable 
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) 
        : options

    useEffect(() => {
        if (open && ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            // If less than 240px space below, open upwards
            if (spaceBelow < 240) {
                setPlacement('top')
            } else {
                setPlacement('bottom')
            }
        }
    }, [open])

    const sizeClasses = {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-11 px-3.5 text-sm',
        lg: 'h-12 px-4 text-base'
    }

    const base = 'w-full bg-surface text-fg border rounded-[var(--rad-input)] transition-colors flex items-center justify-between gap-2'

    const stateClasses = error
        ? 'border-danger ring-1 ring-danger/20'
        : open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-line hover:border-line-strong'

    const disabledClasses = disabled
        ? 'opacity-60 cursor-not-allowed bg-surface2'
        : 'cursor-pointer'

    return (
        <div className={cn('relative w-full', className)} ref={ref}>
            <div
                className={cn(base, sizeClasses[size], stateClasses, disabledClasses)}
                onClick={() => !disabled && setOpen(!open)}
            >
                <span className={cn('truncate flex-1 text-left', !selected && 'text-subtle')}>
                    {selected ? selected.label : placeholder}
                </span>

                <ChevronDown
                    size={size === 'sm' ? 14 : 16}
                    className={cn('text-muted shrink-0 transition-transform', open && 'rotate-180')}
                />
            </div>

            {open && !disabled && (
                <div 
                    className={cn(
                        "absolute z-[100] w-full bg-card border border-line rounded-[var(--rad-card)] shadow-pop overflow-hidden animate-fade-in",
                        placement === 'top' ? "bottom-full mb-1" : "top-full mt-1"
                    )}
                >
                    <div className="max-h-60 overflow-y-auto py-1 flex flex-col">
                        {searchable && (
                            <div className="px-2 pb-1 sticky top-0 bg-card z-10">
                                <input
                                    type="text"
                                    className="w-full bg-surface2 text-fg text-sm px-2.5 py-1.5 rounded outline-none border border-transparent focus:border-primary/50 transition-colors"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-3 text-sm text-muted text-center">No options found</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const active = opt.value === value
                                return (
                                    <div
                                        key={opt.value}
                                        className={cn(
                                            'px-3 cursor-pointer hover:bg-surface2 transition-colors',
                                            size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-sm',
                                            active && 'bg-primary/10 text-primary font-medium'
                                        )}
                                        onClick={() => {
                                            onChange(opt.value)
                                            setOpen(false)
                                            setSearch('')
                                        }}
                                    >
                                        {opt.label}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
