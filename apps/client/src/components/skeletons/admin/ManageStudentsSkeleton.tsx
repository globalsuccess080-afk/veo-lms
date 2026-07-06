import React from 'react'
import { AdminPage } from '../../admin/AdminPage'
import { TableSkeleton } from '../shared/TableSkeleton'
import { Skeleton } from '../../ui/Skeleton'

export function ManageStudentsSkeleton() {
  return (
    <AdminPage
      title="Students"
      subtitle="Manage learners on your platform"
      actions={
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-btn" />
          <Skeleton className="h-10 w-24 rounded-btn" />
        </div>
      }
    >
      <div className="mb-6 border border-line/80 bg-surface rounded-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <Skeleton className="h-10 w-full md:w-64 rounded-[var(--rad-input)]" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40 rounded-[var(--rad-input)]" />
          </div>
        </div>
      </div>

      <TableSkeleton columns={6} rows={10} showFilters={false} />
    </AdminPage>
  )
}
