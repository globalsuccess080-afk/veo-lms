import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useClickOutside } from '../../hooks/useClickOutside'

export interface AppSelectProps {
  value: string | undefined
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  className?: string
  loading?: boolean
  error?: string
  searchable?: boolean
  disabled?: boolean
}

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  loading,
  error,
  searchable = true,
  disabled
}: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const filteredOptions = searchable 
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [open, searchable])

  const base = 'w-full bg-surface text-fg border rounded-[var(--rad-input)] px-3.5 transition-colors h-12 md:h-11 flex items-center justify-between text-sm'
  const stateClasses = error 
    ? 'border-danger ring-1 ring-danger/20' 
    : open ? 'border-primary ring-2 ring-primary/20' : 'border-line hover:border-line-strong'
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed bg-surface2' : 'cursor-pointer'

  return (
    <div className={cn('relative w-full', className)} ref={ref}>
      <div 
        className={cn(base, stateClasses, disabledClasses)}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={cn('truncate', !selectedOption && 'text-subtle')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        {loading ? (
          <Loader2 size={16} className="animate-spin text-muted shrink-0 ml-2" />
        ) : (
          <ChevronDown size={16} className={cn("text-muted shrink-0 ml-2 transition-transform", open && "rotate-180")} />
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-line rounded-[var(--rad-card)] shadow-pop overflow-hidden animate-fade-in">
          {searchable && (
            <div className="flex items-center px-3 border-b border-line bg-surface/50">
              <Search size={14} className="text-muted shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                className="w-full bg-transparent h-10 outline-none text-sm placeholder:text-subtle"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer hover:bg-surface2 transition-colors",
                    opt.value === value && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
