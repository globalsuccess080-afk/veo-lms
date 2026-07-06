import React from 'react'
import { Skeleton } from '../../ui/Skeleton'

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="p-6 rounded-card border border-line bg-surface shadow-sm w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 opacity-60" />
        </div>
        <Skeleton className="h-9 w-24 rounded-btn" />
      </div>
      <div className="flex gap-4 h-full items-end" style={{ height: `${height}px` }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-sm opacity-50" 
            style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
          />
        ))}
      </div>
    </div>
  )
}
