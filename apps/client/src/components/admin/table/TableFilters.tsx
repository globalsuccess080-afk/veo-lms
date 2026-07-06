import React from 'react'
import { Filter } from 'lucide-react'

interface TableFiltersProps {
  children: React.ReactNode
}

export function TableFilters({ children }: TableFiltersProps) {
  // A simple wrapper for filters, to be placed next to the search bar.
  // In a more complex setup, this could be a Popover.
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full md:w-auto">
      <div className="flex items-center text-sm font-medium text-muted">
        <Filter size={16} className="mr-1.5" />
        Filters:
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        {children}
      </div>
    </div>
  )
}
