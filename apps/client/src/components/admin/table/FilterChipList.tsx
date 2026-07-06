import React from 'react'
import { X } from 'lucide-react'

interface FilterChipListProps {
  filters: Record<string, string>
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function FilterChipList({ filters, onRemove, onClearAll }: FilterChipListProps) {
  const entries = Object.entries(filters)
  
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <span className="text-sm text-muted mr-1">Active Filters:</span>
      {entries.map(([key, value]) => (
        <span 
          key={key} 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2 border border-line text-xs font-medium text-fg"
        >
          <span className="text-muted capitalize">{key}:</span> {value}
          <button
            onClick={() => onRemove(key)}
            className="text-muted hover:text-fg hover:bg-line/50 rounded-full p-0.5 ml-1"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted hover:text-fg underline underline-offset-2 ml-2"
      >
        Clear all
      </button>
    </div>
  )
}
