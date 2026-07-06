import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ColumnDef } from '@tanstack/react-table'

import { getAdminCourses, deleteCourse, publishCourse, deleteBulkCourses } from '../../services/course.service'
import { exportCourses, importCourses } from '../../services/admin.service'
import { AdminPage } from '../../components/admin/AdminPage'
import { ExportMenu } from '../../components/admin/ExportMenu'
import { ImportModal } from '../../components/admin/ImportModal'
import { VideoProcessingModal } from '../../components/admin/VideoProcessingModal'
import { useProcessingStore } from '../../store/processingStore'
import { handleExportData } from '../../utils/exportUtils'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { buttonClass } from '../../components/ui/Button'
import { formatINR } from '../../lib/utils'
import { Course } from '@veolms/shared'

import { useTableState } from '../../components/admin/table/useTableState'
import { DataTable } from '../../components/admin/table/DataTable'
import { TableSearch } from '../../components/admin/table/TableSearch'
import { TablePagination } from '../../components/admin/table/TablePagination'
import { TableBulkActions } from '../../components/admin/table/TableBulkActions'
import { FilterChipList } from '../../components/admin/table/FilterChipList'
import { Checkbox } from '../../components/ui/Checkbox'
import { Dropdown } from '../../components/ui/Dropdown'
import { TableFilters } from '../../components/admin/table/TableFilters'
import { ManageCoursesSkeleton } from '../../components/skeletons/admin/ManageCoursesSkeleton'
import { useAlertStore } from '../../store/alertStore'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function StatusCell({ course, onOpenProcessing }: { course: Course; onOpenProcessing: () => void }) {
  const allJobs = useProcessingStore(s => s.jobs)
  const jobs = allJobs.filter(j => j.courseId === course.id && (j.status === 'queued' || j.status === 'processing'))
  const hasActiveJobs = jobs.length > 0

  return (
    <div className="flex items-center gap-2">
      <Badge tone={course.isPublished ? 'success' : 'warning'} className="font-bold px-2.5 py-1">
        {course.isPublished ? 'Published' : 'Draft'}
      </Badge>
      {hasActiveJobs && (
        <div className="relative group">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenProcessing(); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Processing
          </button>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-surface border border-line-strong rounded-lg shadow-pop text-xs text-fg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
            <p className="font-bold mb-2 border-b border-line pb-1.5 text-primary">Processing ({jobs.length})</p>
            <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1.5">
              {jobs.map(job => (
                <div key={job.lessonId} className="flex justify-between items-center gap-2">
                  <span className="truncate flex-1 font-medium">{job.lessonTitle}</span>
                  <span className="text-[10px] font-bold text-muted bg-surface2 px-1.5 py-0.5 rounded shrink-0">{job.progress || 0}%</span>
                </div>
              ))}
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-surface border-t-8 border-x-transparent border-x-8 border-b-0" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[0px] border-solid border-t-line-strong border-t-[9px] border-x-transparent border-x-[9px] border-b-0 -z-10" />
          </div>
        </div>
      )}
    </div>
  )
}

export function ManageCoursesPage() {
  const queryClient = useQueryClient()
  const {
    pagination, setPagination,
    sorting, setSorting,
    search, setSearch,
    filters, setFilter, removeFilter, clearFilters,
    searchParams
  } = useTableState()

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [activeModalCourse, setActiveModalCourse] = useState<{ id: string; title: string } | null>(null)
  const showAlert = useAlertStore(s => s.showAlert)

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      toast.info('Exporting data...')
      const fullData = await exportCourses()
      const exportColumns = [
        { header: 'Title', dataKey: 'title' },
        { header: 'Slug', dataKey: 'slug' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Price', dataKey: 'price' },
        { header: 'Total Lessons', dataKey: 'totalLessons' },
        { header: 'Status', dataKey: 'isPublished' }
      ]
      handleExportData(fullData, exportColumns, format, 'courses_export')
      toast.success('Export complete')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  // Fetch data
  const queryParams = Object.fromEntries(searchParams.entries())
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-courses', queryParams],
    queryFn: () => getAdminCourses(queryParams),
    placeholderData: (prev) => prev, // keepPreviousData logic in v5
  })

  const courses = data?.courses || []
  const meta = data?.meta || { total: 0, totalPages: 0 }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-courses'] })

  const deleteMut = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => { invalidate(); toast.success('Course deleted'); setRowSelection({}) }
  })
  const publishMut = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => publishCourse(id, isPublished),
    onSuccess: () => { invalidate(); toast.success('Course status updated') }
  })

  // Bulk actions handlers
  const handleBulkDelete = () => {
    const ids = Object.keys(rowSelection)
    if (ids.length === 0) return
    showAlert({
      title: 'Delete Courses',
      message: `Are you sure you want to delete ${ids.length} selected courses?`,
      danger: true,
      confirmText: 'Delete',
      onConfirm: () => {
        deleteBulkCourses(ids)
          .then(() => {
            // No need to instantly invalidate because the backend job takes time.
            // But we can clear selection.
            toast.success(`Deletion of ${ids.length} courses started in background. They will disappear shortly.`)
            setRowSelection({})
            // Optionally set a timeout to invalidate later or let the user refresh manually.
            setTimeout(() => invalidate(), 3000)
          })
          .catch(() => toast.error('Error deleting courses'))
      }
    })
  }

  // Columns definition
  const columns = useMemo<ColumnDef<Course>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: 'Course',
      cell: ({ row }) => {
        const course = row.original
        return (
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-10 rounded-md overflow-hidden bg-surface2 border border-line shrink-0 shadow-sm">
              <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-[14px] text-fg line-clamp-1">{course.title}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => <span className="font-medium text-muted">{formatINR(row.getValue('price'))}</span>,
    },
    {
      accessorKey: 'totalLessons',
      header: 'Lessons',
      cell: ({ row }) => <span className="font-medium text-muted">{row.getValue('totalLessons')}</span>,
    },
    {
      accessorKey: 'enrollmentCount',
      header: 'Enrollments',
      cell: ({ row }) => <span className="font-medium text-muted">{row.getValue('enrollmentCount')}</span>,
    },
    {
      accessorKey: 'isPublished',
      header: 'Status',
      cell: ({ row }) => (
        <StatusCell
          course={row.original}
          onOpenProcessing={() => setActiveModalCourse({ id: row.original.id, title: row.original.title })}
        />
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const course = row.original
        return (
          <div className="flex items-center gap-1.5">
            <Link to={`/admin/courses/${course.id}/edit`} className="p-2 rounded-lg text-muted hover:bg-surface hover:text-primary transition-all shadow-sm border border-transparent hover:border-line" title="Edit">
              <Pencil size={16} strokeWidth={2.5} />
            </Link>
            <button onClick={() => publishMut.mutate({ id: course.id, isPublished: !course.isPublished })} className="p-2 rounded-lg text-muted hover:bg-surface hover:text-fg transition-all shadow-sm border border-transparent hover:border-line" title={course.isPublished ? 'Unpublish' : 'Publish'}>
              {course.isPublished ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
            </button>
            <button onClick={() => {
              showAlert({
                title: 'Delete Course',
                message: 'Are you sure you want to delete this course?',
                danger: true,
                confirmText: 'Delete',
                onConfirm: () => deleteMut.mutate(course.id)
              })
            }} className="p-2 rounded-lg text-muted hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition-all shadow-sm border border-transparent" title="Delete">
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        )
      }
    }
  ], [deleteMut, publishMut])

  if (isLoading && !courses.length) {
    return <ManageCoursesSkeleton />
  }

  return (
    <AdminPage
      title="Courses"
      subtitle="Create and manage your course catalog"
      actions={
        <div className="flex items-center gap-2">
          <ExportMenu onExport={handleExport} />
          <button 
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-btn)] hover:bg-[var(--bg-tertiary)]"
          >
            Import
          </button>
          <Link to="/admin/courses/new" className={buttonClass('primary', 'md') + " font-bold shadow-soft"}>
            <Plus size={18} strokeWidth={2.5} /> New Course
          </Link>
        </div>
      }
    >
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(file) => importCourses(file).then(res => { invalidate(); return res; })}
        title="Import Courses"
        templateHeaders={['title', 'slug', 'description', 'shortDescription', 'price', 'originalPrice', 'category', 'level', 'isPublished']}
        templateFileName="courses_template"
      />
      {activeModalCourse && (
        <VideoProcessingModal
          courseId={activeModalCourse.id}
          courseTitle={activeModalCourse.title}
          isOpen={true}
          onClose={() => setActiveModalCourse(null)}
        />
      )}
      <motion.div initial="hidden" animate="show" variants={containerVars}>

        <motion.div variants={itemVars}>
          <Card className="p-6 border-line/80 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <TableSearch initialValue={search} onSearch={setSearch} placeholder="Search courses..." />
              
              <TableFilters>
                <div className="w-40">
                  <Dropdown
                    value={filters.isPublished || ''}
                    onChange={(val) => setFilter('isPublished', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'true', label: 'Published' },
                      { value: 'false', label: 'Draft' },
                    ]}
                    placeholder="Status"
                  />
                </div>
                <div className="w-40">
                  <Dropdown
                    value={filters.level || ''}
                    onChange={(val) => setFilter('level', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Levels' },
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' },
                    ]}
                    placeholder="Level"
                  />
                </div>
              </TableFilters>
            </div>
            
            <FilterChipList filters={filters} onRemove={removeFilter} onClearAll={clearFilters} />
          </Card>

          <TableBulkActions 
            selectedCount={Object.keys(rowSelection).length} 
            onClearSelection={() => setRowSelection({})}
            actions={
              <button 
                onClick={handleBulkDelete}
                className="text-sm font-semibold hover:underline text-danger px-2"
              >
                Delete Selected
              </button>
            }
          />

          <DataTable
            columns={columns}
            data={courses}
            pageCount={meta.totalPages}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            isLoading={isLoading || isPlaceholderData}
            getRowId={(row) => row.id}
          />
          
          {courses.length > 0 && (
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
