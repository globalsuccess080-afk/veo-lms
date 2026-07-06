import React from 'react'
import { AdminPage } from '../../admin/AdminPage'
import { TableSkeleton } from '../shared/TableSkeleton'
import { Skeleton } from '../../ui/Skeleton'

export function EnrollmentsSkeleton() {
  return (
    <AdminPage
      title="Enrollments"
      subtitle="All course enrollments across the platform"
      actions={<Skeleton className="h-10 w-32 rounded-[var(--rad-btn)]" />}
    >
      <div className="mb-6 border border-line/80 bg-surface rounded-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-40 rounded-[var(--rad-input)]" />
        </div>
      </div>

      <TableSkeleton columns={5} rows={10} showFilters={false} />
    </AdminPage>
  )
}
