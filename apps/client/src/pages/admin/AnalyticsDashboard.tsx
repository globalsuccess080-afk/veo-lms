import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IndianRupee, Users, BookOpen, TrendingUp, Upload, Filter, Megaphone, Search, ArrowUpDown } from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { toast } from 'sonner'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'

import { getDashboardAnalytics } from '../../services/analytics.service'
import { getAdminStreakLeaderboard } from '../../services/streak.service'
import { exportCourses, importCourses, importStudents } from '../../services/admin.service'
import { AdminPage } from '../../components/admin/AdminPage'
import { Card } from '../../components/ui/Card'
import { Dropdown } from '../../components/ui/Dropdown'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatINR, cn } from '../../lib/utils'
import { ExportMenu } from '../../components/admin/ExportMenu'
import { ImportModal } from '../../components/admin/ImportModal'
import { handleExportData } from '../../utils/exportUtils'

const COLORS = ['var(--primary)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function DataTable<T>({ data, columns, searchPlaceholder }: { data: T[], columns: ColumnDef<T, any>[], searchPlaceholder: string }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <Input 
          className="pl-9 h-10 bg-surface2/50 border-line hover:border-line-strong transition-all" 
          placeholder={searchPlaceholder}
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line/50">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-line/50 bg-surface2/30">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-3 text-[13px] font-bold text-muted uppercase tracking-wide cursor-pointer hover:text-fg transition-colors select-none group" onClick={header.column.getToggleSortingHandler()}>
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUpDown size={14} className="text-primary rotate-180" />,
                        desc: <ArrowUpDown size={14} className="text-primary" />,
                      }[header.column.getIsSorted() as string] ?? <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-line/50 last:border-0 hover:bg-surface2/30 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3 text-[14px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-muted">No results found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState('30d')
  const [isImportCoursesOpen, setIsImportCoursesOpen] = useState(false)
  const [isImportStudentsOpen, setIsImportStudentsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard', range],
    queryFn: () => getDashboardAnalytics(range)
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['streak-leaderboard'],
    queryFn: getAdminStreakLeaderboard
  })

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      toast.info('Exporting data... This may take a moment.')
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

  if (isLoading || !data) {
    return (
      <AdminPage title="Analytics Dashboard">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminPage>
    )
  }

  const { overview, trends, breakdowns, topCourses, couponStats, lessonAnalytics } = data

  const statCards = [
    { label: `Revenue (${range})`, value: formatINR(overview.revenue.range / 100), subtext: `Avg Order: ${formatINR(overview.revenue.avgOrderValue / 100)}`, icon: IndianRupee, tone: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { label: 'Total Students', value: overview.students.total, subtext: `+${overview.students.newRange} in range`, icon: Users, tone: 'text-info', bg: 'bg-info/10 border-info/20' },
    { label: 'Total Courses', value: overview.courses.total, subtext: `${overview.courses.published} published, ${overview.courses.draft} draft`, icon: BookOpen, tone: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Announcements Sent', value: overview.announcements?.sentRange || 0, subtext: `In selected range`, icon: Megaphone, tone: 'text-success', bg: 'bg-success/10 border-success/20' },
  ]

  const topCoursesColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'title', header: 'Course Name', cell: info => <span className="font-bold text-fg truncate block max-w-[200px]" title={info.getValue() as string}>{info.getValue() as string}</span> },
    { accessorKey: 'revenue', header: 'Revenue', cell: info => <span className="text-primary font-bold">{formatINR((info.getValue() as number) / 100)}</span> },
    { id: 'funnel', header: 'Funnel (Purchased → Started → Completed)', cell: info => {
      const c = info.row.original
      return (
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="font-bold text-fg">{c.purchased}</span>
          <span className="text-muted">→</span>
          <span className="font-bold text-fg">{c.started} <span className="text-[11px] text-muted font-normal">({c.conversionFromStart}%)</span></span>
          <span className="text-muted">→</span>
          <span className="font-bold text-fg">{c.completed} <span className="text-[11px] text-success font-normal">({c.completionRate}%)</span></span>
        </div>
      )
    }},
    { accessorKey: 'watchTimeHours', header: 'Watch Time', cell: info => <span className="text-muted font-medium">{info.getValue() as string}h</span> }
  ]

  const topLessonsColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'title', header: 'Lesson Name', cell: info => <span className="font-bold text-fg truncate block max-w-[200px]" title={info.getValue() as string}>{info.getValue() as string}</span> },
    { accessorKey: 'courseTitle', header: 'Course', cell: info => <Badge tone="neutral">{info.getValue() as string}</Badge> },
    { accessorKey: 'totalWatchTimeHours', header: 'Total Watch Time', cell: info => <span className="text-fg font-medium">{info.getValue() as string}h</span> },
    { accessorKey: 'avgWatchTimeMinutes', header: 'Avg Watch Time', cell: info => <span className="text-muted">{info.getValue() as string}m</span> },
    { id: 'completion', header: 'Started → Completed', cell: info => {
      const l = info.row.original
      return (
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="font-bold text-fg">{l.started}</span>
          <span className="text-muted">→</span>
          <span className="font-bold text-fg">{l.completed} <span className="text-[11px] text-success font-normal">({l.completionRate}%)</span></span>
        </div>
      )
    }}
  ]

  const couponsColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'code', header: 'Code', cell: info => <Badge tone="primary">{info.getValue() as string}</Badge> },
    { accessorKey: 'uses', header: 'Uses', cell: info => <span className="text-muted font-medium">{info.getValue() as number}</span> },
    { accessorKey: 'totalDiscount', header: 'Discount', cell: info => <span className="text-danger font-bold">-{formatINR((info.getValue() as number) / 100)}</span> }
  ]

  const leaderboardColumns: ColumnDef<any, any>[] = [
    { accessorKey: 'name', header: 'Student Name', cell: info => <span className="font-bold text-fg">{info.getValue() as string}</span> },
    { accessorKey: 'currentStreak', header: 'Streak', cell: info => <span className="text-orange-500 font-bold">{info.getValue() as number} Days</span> }
  ]

  return (
    <AdminPage 
      title="Analytics Dashboard" 
      subtitle="Deep insights into revenue, engagement, and growth"
      actions={
        <div className="flex items-center gap-4">
          <div className="w-40">
            <Dropdown
              value={range}
              onChange={setRange}
              options={[
                { value: 'today', label: 'Today' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: 'this_year', label: 'This Year' }
              ]}
              icon={<Filter size={16} />}
            />
          </div>
          <div className="flex gap-2 border-l border-line pl-4">
            <ExportMenu onExport={handleExport} />
            <button onClick={() => setIsImportCoursesOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-surface2 text-fg text-sm font-medium rounded-btn hover:bg-line transition-colors">
              <Upload size={16} /> Import Courses
            </button>
            <button onClick={() => setIsImportStudentsOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-surface2 text-fg text-sm font-medium rounded-btn hover:bg-line transition-colors">
              <Upload size={16} /> Import Students
            </button>
          </div>
        </div>
      }
    >
      <ImportModal
        isOpen={isImportCoursesOpen}
        onClose={() => setIsImportCoursesOpen(false)}
        onImport={(file) => importCourses(file)}
        title="Import Courses"
        templateHeaders={['title', 'slug', 'description', 'price', 'category', 'isPublished']}
        templateFileName="courses_template"
      />
      <ImportModal
        isOpen={isImportStudentsOpen}
        onClose={() => setIsImportStudentsOpen(false)}
        onImport={(file) => importStudents(file)}
        title="Import Students"
        templateHeaders={['name', 'email', 'password']}
        templateFileName="students_template"
      />

      <motion.div initial="hidden" animate="show" variants={containerVars}>
        {/* KPI CARDS */}
        <motion.div variants={itemVars} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {statCards.map((c) => (
            <Card key={c.label} className="p-6 flex flex-col justify-between border-line/50 hover:shadow-md transition-all group hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full opacity-50" style={{ background: `linear-gradient(to bottom, transparent, var(--${c.tone.split('-')[1]}), transparent)` }} />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[13px] font-bold text-muted uppercase tracking-wide">{c.label}</span>
                  <p className="text-[2rem] font-extrabold tracking-tight text-fg leading-none mt-2">{c.value}</p>
                </div>
                <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm transition-colors group-hover:bg-transparent shrink-0 ${c.bg}`}>
                  <c.icon size={20} className={c.tone} strokeWidth={2.5} />
                </span>
              </div>
              <p className="text-[13px] text-muted font-medium mt-1">{c.subtext}</p>
            </Card>
          ))}
        </motion.div>

        {/* CHARTS */}
        <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-line/50 lg:col-span-2">
            <h3 className="text-lg font-bold text-fg mb-6">Revenue Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 100}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 'var(--rad-card)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                    formatter={(value: number) => [`₹${value / 100}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-6 border-line/50 lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-fg mb-6">Revenue by Category</h3>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdowns.category} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {breakdowns.category.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 'var(--rad-card)' }}
                    formatter={(value: number) => [`₹${value / 100}`, 'Revenue']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* TABLES ROW 1 */}
        <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-line/50 lg:col-span-2 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-fg mb-4">Top Performing Courses</h3>
            <div className="flex-1">
              <DataTable data={topCourses || []} columns={topCoursesColumns} searchPlaceholder="Search courses..." />
            </div>
          </Card>
          <Card className="p-6 border-line/50 lg:col-span-1 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-fg mb-4">Top Coupons</h3>
            <div className="flex-1">
              <DataTable data={couponStats || []} columns={couponsColumns} searchPlaceholder="Search coupons..." />
            </div>
          </Card>
        </motion.div>

        {/* TABLES ROW 2 */}
        <motion.div variants={itemVars} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-line/50 lg:col-span-2 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-fg mb-4">In-Depth Lesson Analytics</h3>
            <div className="flex-1">
              <DataTable data={lessonAnalytics || []} columns={topLessonsColumns} searchPlaceholder="Search lessons..." />
            </div>
          </Card>
          <Card className="p-6 border-line/50 lg:col-span-1 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
              <span className="text-orange-500">🔥</span> Top Streak Holders
            </h3>
            <div className="flex-1">
              <DataTable data={leaderboard || []} columns={leaderboardColumns} searchPlaceholder="Search students..." />
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AdminPage>
  )
}
