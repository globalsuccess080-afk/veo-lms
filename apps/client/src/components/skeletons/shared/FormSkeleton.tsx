import React from 'react'
import { Skeleton } from '../../ui/Skeleton'

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 w-full max-w-2xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-[var(--rad-input)]" />
        </div>
      ))}
      <div className="pt-4 flex justify-end gap-3">
        <Skeleton className="h-11 w-24 rounded-btn" />
        <Skeleton className="h-11 w-32 rounded-btn" />
      </div>
    </div>
  )
}
