import React from 'react'
import { AdminPage } from '../../admin/AdminPage'
import { StatCardSkeleton } from '../shared/StatCardSkeleton'
import { TableSkeleton } from '../shared/TableSkeleton'
import { Skeleton } from '../../ui/Skeleton'

export function AnnouncementsSkeleton() {
  return (
    <AdminPage
      title="Announcements"
      subtitle="Broadcast messages, updates, and offers to your students"
      actions={<Skeleton className="h-10 w-44 rounded-btn" />}
    >
      <div className="mb-6 border border-line/80 bg-surface rounded-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <Skeleton className="h-10 w-full md:w-64 rounded-[var(--rad-input)]" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40 rounded-[var(--rad-input)]" />
            <Skeleton className="h-10 w-40 rounded-[var(--rad-input)]" />
          </div>
        </div>
      </div>

      <TableSkeleton columns={5} rows={8} showFilters={false} />
    </AdminPage>
  )
}
