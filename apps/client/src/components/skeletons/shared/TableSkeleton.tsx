import React from 'react'
import { Skeleton } from '../../ui/Skeleton'

interface TableSkeletonProps {
  columns?: number
  rows?: number
  showFilters?: boolean
}

export function TableSkeleton({ columns = 5, rows = 10, showFilters = true }: TableSkeletonProps) {
  return (
    <div className="w-full">
      {showFilters && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-6 rounded-card border border-line bg-surface">
          <Skeleton className="h-10 w-full md:w-64" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden border border-line rounded-card bg-surface shadow-sm">
        <div className="grid border-b border-line bg-surface2 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-24 bg-line/50" />
          ))}
        </div>
        
        <div>
          {Array.from({ length: rows }).map((_, i) => (
            <div 
              key={i} 
              className="grid px-5 py-4 border-b border-line/50 last:border-0 items-center" 
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, j) => (
                <div key={j} className="pr-4">
                  <Skeleton className={`h-4 ${j === 0 ? 'w-3/4' : 'w-1/2'}`} />
                  {j === 0 && <Skeleton className="h-3 w-1/2 mt-2 opacity-60" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 px-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-btn" />
          <Skeleton className="h-8 w-8 rounded-btn" />
          <Skeleton className="h-8 w-8 rounded-btn" />
        </div>
      </div>
    </div>
  )
}
