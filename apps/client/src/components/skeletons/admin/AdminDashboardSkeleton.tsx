import React from 'react'
import { AdminPage } from '../../admin/AdminPage'
import { StatCardSkeleton } from '../shared/StatCardSkeleton'
import { TableSkeleton } from '../shared/TableSkeleton'
import { Skeleton } from '../../ui/Skeleton'

export function AdminDashboardSkeleton() {
  return (
    <AdminPage title="Dashboard" subtitle="Overview of your learning platform">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 flex items-center gap-4 bg-surface border border-line/80 rounded-card shadow-sm">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24 opacity-70" />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        <TableSkeleton columns={4} rows={5} showFilters={false} />
      </div>
    </AdminPage>
  )
}
