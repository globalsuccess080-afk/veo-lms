import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../../ui/Input'
import { useDebounce } from '../../../hooks/useDebounce'

interface TableSearchProps {
  initialValue: string
  onSearch: (value: string) => void
  placeholder?: string
}

export function TableSearch({ initialValue, onSearch, placeholder = "Search..." }: TableSearchProps) {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, 500)

  // Sync internal state if initialValue changes (e.g. from URL clear)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Call onSearch when debounced value changes
  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, initialValue, onSearch])

  return (
    <div className="relative w-full flex-1 md:max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 bg-surface2/50 border-line/80 focus:bg-surface w-full"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
