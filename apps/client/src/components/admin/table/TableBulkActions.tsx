import React from 'react'
import { X } from 'lucide-react'

interface TableBulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  actions: React.ReactNode
}

export function TableBulkActions({ selectedCount, onClearSelection, actions }: TableBulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 text-primary-fg px-4 py-2.5 rounded-card mb-4 shadow-sm animate-in fade-in slide-in-from-top-4">
      <span className="text-sm font-medium text-primary">
        {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
      </span>
      <div className="w-px h-4 bg-primary/20 mx-1"></div>
      <div className="flex items-center gap-2 flex-1">
        {actions}
      </div>
      <button 
        onClick={onClearSelection}
        className="p-1 hover:bg-primary/20 rounded-md transition-colors text-primary"
        title="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  )
}
