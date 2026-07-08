import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { GraduationCap } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { ColumnDef } from '@tanstack/react-table'

import { getEnrollments, exportEnrollments } from '../../services/admin.service'
import { AdminPage } from '../../components/admin/AdminPage'
import { ExportMenu } from '../../components/admin/ExportMenu'
import { handleExportData } from '../../utils/exportUtils'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Dropdown } from '../../components/ui/Dropdown'

import { useTableState } from '../../components/admin/table/useTableState'
import { DataTable } from '../../components/admin/table/DataTable'
import { TablePagination } from '../../components/admin/table/TablePagination'
import { FilterChipList } from '../../components/admin/table/FilterChipList'
import { TableFilters } from '../../components/admin/table/TableFilters'
import { EnrollmentsSkeleton } from '../../components/skeletons/admin/EnrollmentsSkeleton'

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function EnrollmentsPage() {
  const {
    pagination, setPagination,
    sorting, setSorting,
    filters, setFilter, removeFilter, clearFilters,
    searchParams
  } = useTableState()

  const queryParams = Object.fromEntries(searchParams.entries())
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-enrollments', queryParams],
    queryFn: () => getEnrollments(queryParams),
    placeholderData: (prev) => prev
  })

  const enrollments: Record<string, unknown>[] = data?.enrollments || []
  const meta = data?.meta || { total: 0, totalPages: 0 }

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      toast.info('Exporting data...')
      const fullData = await exportEnrollments()
      const exportColumns = [
        { header: 'Student Name', dataKey: 'studentName' },
        { header: 'Course Title', dataKey: 'courseTitle' },
        { header: 'Progress (%)', dataKey: 'progress' },
        { header: 'Enrolled At', dataKey: 'enrolledAt' }
      ]
      handleExportData(fullData, exportColumns, format, 'enrollments_export')
      toast.success('Export complete')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const studentName = (row.original.user as { name?: string })?.name || 'Student'
        return (
          <div className="flex items-center gap-4">
            <Avatar name={studentName} size={36} className="shadow-sm ring-2 ring-transparent group-hover:ring-primary-subtle transition-all" />
            <span className="font-bold text-[14px] text-fg">{studentName}</span>
          </div>
        )
      },
      enableSorting: false
    },
    {
      id: 'course',
      header: 'Course',
      cell: ({ row }) => {
        const courseTitle = (row.original.course as { title?: string })?.title || 'Course'
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-medium text-fg">{courseTitle}</span>
          </div>
        )
      },
      enableSorting: false
    },
    {
      accessorKey: 'enrolledAt',
      header: 'Enrolled Date',
      cell: ({ row }) => <span className="text-[13px] text-subtle font-medium">{format(new Date(row.getValue('enrolledAt')), 'MMM d, yyyy')}</span>,
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const progress = row.getValue('progress') as number
        return (
          <Badge tone={progress === 100 ? 'success' : 'primary'} className="font-bold px-2.5 py-1">
            {progress}%
          </Badge>
        )
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive')
        return (
          <Badge tone={isActive ? 'success' : 'danger'} className="font-bold px-2.5 py-1">
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      }
    }
  ], [])

  if (isLoading && !enrollments.length) {
    return <EnrollmentsSkeleton />
  }

  return (
    <AdminPage 
      title="Enrollments" 
      subtitle="All course enrollments across the platform"
      actions={
        <ExportMenu onExport={handleExport} />
      }
    >
      <motion.div initial="hidden" animate="show" variants={containerVars}>
        <motion.div variants={itemVars}>
          <Card className="p-6 border-line/80 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <div className="font-bold text-fg text-lg">Enrollments</div>
              
              <TableFilters>
                <div className="w-40">
                  <Dropdown
                    value={filters.isActive || ''}
                    onChange={(val) => setFilter('isActive', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ]}
                    placeholder="Status"
                  />
                </div>
              </TableFilters>
            </div>
            
            <FilterChipList filters={filters} onRemove={removeFilter} onClearAll={clearFilters} />
          </Card>

          <DataTable
            columns={columns}
            data={enrollments}
            pageCount={meta.totalPages}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            isLoading={isLoading || isPlaceholderData}
          />
          
          {enrollments.length > 0 && (
            <TablePagination
              pagination={pagination}
              setPagination={setPagination}
              totalCount={meta.total}
              totalPages={meta.totalPages}
            />
          )}
        </motion.div>
      </motion.div>
    </AdminPage>
  )
}
