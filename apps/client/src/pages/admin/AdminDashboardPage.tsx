import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { BookOpen, Users, GraduationCap, IndianRupee, Plus, Megaphone, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { getStats } from '../../services/admin.service'
import { formatINR } from '../../lib/utils'
import { AdminPage, Table } from '../../components/admin/AdminPage'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { AdminDashboardSkeleton } from '../../components/skeletons/admin/AdminDashboardSkeleton'

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: getStats })

  const cards = [
    { label: 'Total Courses', value: stats?.totalCourses ?? 0, icon: BookOpen, tone: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, tone: 'text-info', bg: 'bg-info/10 border-info/20' },
    { label: 'Enrollments', value: stats?.totalEnrollments ?? 0, icon: GraduationCap, tone: 'text-success', bg: 'bg-success/10 border-success/20' },
    { label: 'Revenue (test)', value: formatINR((stats?.totalRevenue ?? 0) / 100), icon: IndianRupee, tone: 'text-warning', bg: 'bg-warning/10 border-warning/20' }
  ]

  if (isLoading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <AdminPage title="Dashboard" subtitle="Overview of your learning platform">
      <motion.div initial="hidden" animate="show" variants={containerVars}>
        <motion.div variants={itemVars} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {cards.map((c) => (
            <Card key={c.label} className="p-6 flex flex-col justify-between border-line/50 hover:shadow-md transition-all group hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full opacity-50" style={{ background: `linear-gradient(to bottom, transparent, var(--${c.tone.split('-')[1]}), transparent)` }} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-bold text-muted uppercase tracking-wide">{c.label}</span>
                <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm transition-colors group-hover:bg-transparent ${c.bg}`}>
                  <c.icon size={20} className={c.tone} strokeWidth={2.5} />
                </span>
              </div>
              <p className="text-[2rem] font-extrabold tracking-tight text-fg leading-none">{c.value}</p>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-10">
          <Link to="/admin/courses/new">
            <Card interactive className="p-5 flex items-center gap-4 bg-surface/50 hover:bg-surface border-line/80 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full opacity-50" style={{ background: 'linear-gradient(to bottom, transparent, var(--primary), transparent)' }} />
              <span className="w-12 h-12 rounded-xl bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                <Plus size={22} strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-bold text-[15px] text-fg tracking-tight">Create Course</p>
                <p className="text-[13px] text-muted font-medium mt-0.5">Add a new course</p>
              </div>
            </Card>
          </Link>
          <Link to="/admin/announcements">
            <Card interactive className="p-5 flex items-center gap-4 bg-surface/50 hover:bg-surface border-line/80 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full opacity-50" style={{ background: 'linear-gradient(to bottom, transparent, var(--info), transparent)' }} />
              <span className="w-12 h-12 rounded-xl bg-info/10 border border-info/20 text-info flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                <Megaphone size={22} strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-bold text-[15px] text-fg tracking-tight">Send Announcement</p>
                <p className="text-[13px] text-muted font-medium mt-0.5">Notify all students</p>
              </div>
            </Card>
          </Link>
          <Link to="/admin/students">
            <Card interactive className="p-5 flex items-center gap-4 bg-surface/50 hover:bg-surface border-line/80 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full opacity-50" style={{ background: 'linear-gradient(to bottom, transparent, var(--success), transparent)' }} />
              <span className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 text-success flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                <Users size={22} strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-bold text-[15px] text-fg tracking-tight">Manage Students</p>
                <p className="text-[13px] text-muted font-medium mt-0.5">View all learners</p>
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={itemVars}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.25rem] font-bold tracking-tight text-fg">Recent Enrollments</h2>
            <Link to="/admin/enrollments" className="text-[13px] font-bold text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {!stats?.recentEnrollments?.length ? (
            <Card className="p-10 text-center text-muted font-medium border-line/50">No enrollments yet</Card>
          ) : (
            <Card className="overflow-hidden border-line/80 shadow-sm">
              <Table head={['Student', 'Course', 'Date', 'Progress']}>
                <AnimatePresence>
                  {stats.recentEnrollments.map((e) => (
                    <motion.tr 
                      key={e.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="hover:bg-surface2/50 transition-colors border-b border-line/50 last:border-0"
                    >
                      <td className="px-5 py-4 font-semibold text-[14px] text-fg">{e.user?.name || 'Student'}</td>
                      <td className="px-5 py-4 text-[14px] text-muted font-medium">{e.course?.title || 'Course'}</td>
                      <td className="px-5 py-4 text-[13px] text-subtle font-medium">{format(new Date(e.enrolledAt), 'MMM d, yyyy')}</td>
                      <td className="px-5 py-4">
                        <Badge tone={e.progress === 100 ? 'success' : 'primary'} className="font-bold px-2.5 py-1">
                          {e.progress}%
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </Table>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </AdminPage>
  )
}
