import React from 'react'
import { Skeleton } from '../../ui/Skeleton'

export function CourseCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface overflow-hidden shadow-sm flex flex-col h-full">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 flex-1 flex flex-col space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full opacity-70" />
        <Skeleton className="h-4 w-5/6 opacity-70" />
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-btn" />
        </div>
      </div>
    </div>
  )
}
