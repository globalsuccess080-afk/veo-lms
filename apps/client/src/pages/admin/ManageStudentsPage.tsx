import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ColumnDef } from '@tanstack/react-table'

import { getStudents, toggleStudent, exportStudents, importStudents } from '../../services/admin.service'
import { AdminPage } from '../../components/admin/AdminPage'
import { ExportMenu } from '../../components/admin/ExportMenu'
import { ImportModal } from '../../components/admin/ImportModal'
import { handleExportData } from '../../utils/exportUtils'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'

import { useTableState } from '../../components/admin/table/useTableState'
import { DataTable } from '../../components/admin/table/DataTable'
import { TableSearch } from '../../components/admin/table/TableSearch'
import { TablePagination } from '../../components/admin/table/TablePagination'
import { FilterChipList } from '../../components/admin/table/FilterChipList'
import { TableFilters } from '../../components/admin/table/TableFilters'
import { Dropdown } from '../../components/ui/Dropdown'
import { ManageStudentsSkeleton } from '../../components/skeletons/admin/ManageStudentsSkeleton'

interface Student { id: string; name: string; email: string; enrollments: number; isActive: boolean; createdAt: string }

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function ManageStudentsPage() {
  const queryClient = useQueryClient()
  const {
    pagination, setPagination,
    sorting, setSorting,
    search, setSearch,
    filters, setFilter, removeFilter, clearFilters,
    searchParams
  } = useTableState()

  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      toast.info('Exporting data...')
      const fullData = await exportStudents()
      const exportColumns = [
        { header: 'Name', dataKey: 'name' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Active', dataKey: 'isActive' },
        { header: 'Joined', dataKey: 'joined' }
      ]
      handleExportData(fullData, exportColumns, format, 'students_export')
      toast.success('Export complete')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  const queryParams = Object.fromEntries(searchParams.entries())
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-students', queryParams],
    queryFn: () => getStudents(queryParams),
    placeholderData: (prev) => prev
  })

  const students: Student[] = data?.students || []
  const meta = data?.meta || { total: 0, totalPages: 0 }

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleStudent(id, isActive),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-students'] }); toast.success('Student updated') }
  })

  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Student',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-4">
            <Avatar name={s.name} size={36} className="shadow-sm ring-2 ring-transparent group-hover:ring-primary-subtle transition-all" />
            <span className="font-bold text-[14px] text-fg">{s.name}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-[14px] text-muted font-medium">{row.getValue('email')}</span>,
      enableSorting: false
    },
    {
      accessorKey: 'enrollments',
      header: 'Enrollments',
      cell: ({ row }) => <span className="text-[14px] text-muted font-medium">{row.getValue('enrollments')}</span>,
      enableSorting: false
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
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => <span className="text-[13px] text-subtle font-medium">{format(new Date(row.getValue('createdAt')), 'MMM d, yyyy')}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleMut.mutate({ id: s.id, isActive: !s.isActive })}
            className={s.isActive ? 'text-danger hover:bg-danger/10 hover:border-danger/20' : 'text-success hover:bg-success/10 hover:border-success/20'}
          >
            {s.isActive ? <><UserX size={14} className="mr-1.5" /> Deactivate</> : <><UserCheck size={14} className="mr-1.5" /> Activate</>}
          </Button>
        )
      }
    }
  ], [toggleMut])

  if (isLoading && !students.length) {
    return <ManageStudentsSkeleton />
  }

  return (
    <AdminPage
      title="Students"
      subtitle="Manage learners on your platform"
      actions={
        <div className="flex items-center gap-2">
          <ExportMenu onExport={handleExport} />
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-btn)] hover:bg-[var(--bg-tertiary)]"
          >
            Import
          </button>
        </div>
      }
    >
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(file) => importStudents(file).then(res => { queryClient.invalidateQueries({ queryKey: ['admin-students'] }); return res; })}
        title="Import Students"
        templateHeaders={['name', 'email', 'password']}
        templateFileName="students_template"
      />
      <motion.div initial="hidden" animate="show" variants={containerVars}>
        <motion.div variants={itemVars}>
          <Card className="p-6 border-line/80 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <TableSearch initialValue={search} onSearch={setSearch} placeholder="Search students..." />

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
            data={students}
            pageCount={meta.totalPages}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            isLoading={isLoading || isPlaceholderData}
          />

          {students.length > 0 && (
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
