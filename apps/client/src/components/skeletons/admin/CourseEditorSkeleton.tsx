import React from 'react'
import { AdminPage } from '../../admin/AdminPage'
import { Skeleton } from '../../ui/Skeleton'

export function CourseEditorSkeleton() {
  return (
    <AdminPage
      title="Edit Course"
      subtitle="Loading course details..."
      actions={<Skeleton className="h-10 w-32 rounded-btn" />}
    >
      <div className="p-6 lg:p-8 mb-8 border border-line/80 shadow-sm bg-surface/50 rounded-card">
        <div className="flex items-center gap-2.5 mb-6 border-b border-line/80 pb-3">
          <Skeleton className="h-5 w-32" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
        </div>
        
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" />
        </div>
        
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-32" /><Skeleton className="h-32 w-full rounded-[var(--rad-input)]" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-48 w-full rounded-[var(--rad-input)]" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full rounded-[var(--rad-input)]" /></div>
        </div>
      </div>

      <div className="p-6 lg:p-8 border border-line/80 shadow-sm bg-surface/50 rounded-card">
        <div className="flex items-center justify-between mb-8 border-b border-line/80 pb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="flex gap-3 mb-8">
          <Skeleton className="h-12 flex-1 rounded-[var(--rad-input)]" />
          <Skeleton className="h-12 w-40 rounded-[var(--rad-input)] shrink-0" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </AdminPage>
  )
}
