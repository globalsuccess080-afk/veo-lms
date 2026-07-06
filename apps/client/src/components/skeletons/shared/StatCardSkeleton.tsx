import React from 'react'
import { Skeleton } from '../../ui/Skeleton'

export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-card border border-line bg-surface shadow-sm flex flex-col justify-between h-[120px]">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  )
}
