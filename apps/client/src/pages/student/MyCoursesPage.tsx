import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMyEnrollments } from '../../services/enrollment.service'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { Progress } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { MyCoursesSkeleton } from '../../components/skeletons/student/MyCoursesSkeleton'
import { buttonClass } from '../../components/ui/Button'
import { cn } from '../../lib/utils'
import { resolveAssetUrl } from '../../lib/assets'

interface EnrollmentItem {
  id: string
  progress: number
  course: { title: string; slug: string; thumbnail: string; totalLessons: number; instructor: { name: string } }
}

type Filter = 'all' | 'progress' | 'completed'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function MyCoursesPage() {
  const { data: enrollments, isLoading } = useQuery<EnrollmentItem[]>({ queryKey: ['my-enrollments'], queryFn: getMyEnrollments })
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = (enrollments || []).filter((e) =>
    filter === 'all' ? true : filter === 'completed' ? e.progress === 100 : e.progress < 100
  )

  if (isLoading) {
    return <MyCoursesSkeleton />
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 text-fg tracking-tight">My Courses</h1>
          <p className="text-[15px] font-medium text-muted">Track and continue your enrolled courses</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2.5 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {([['all', 'All Courses'], ['progress', 'In Progress'], ['completed', 'Completed']] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all shadow-sm shrink-0',
                filter === id ? 'bg-primary text-primary-fg shadow-md' : 'bg-surface/50 border border-line/80 text-muted hover:border-primary/50 hover:text-fg'
              )}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-line/50 p-6 shadow-sm">
              <EmptyState
                icon={BookOpen}
                title="Nothing here yet"
                description={filter === 'all' ? "You haven't enrolled in any courses yet." : `No courses found in "${filter}".`}
                action={<Link to="/search" className={buttonClass('primary', 'md') + " font-bold shadow-soft mt-2"}>Browse Courses</Link>}
              />
            </Card>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={containerVars} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((e) => (
                <motion.div key={e.id} layout variants={itemVars} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}>
                  <Link to={`/learn/${e.course.slug}`} className="block h-full">
                    <Card interactive className="overflow-hidden h-full group border-line/80 bg-surface/50 hover:bg-surface flex flex-col">
                      <div className="relative overflow-hidden shrink-0">
                        <img src={resolveAssetUrl(e.course.thumbnail)} alt="" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        {e.progress === 100 && (
                          <Badge tone="success" className="absolute top-3 right-3 shadow-md backdrop-blur-md bg-success/90">Completed</Badge>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[16px] text-fg mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">{e.course.title}</h3>
                          <p className="text-[13px] font-medium text-muted mb-4">{e.course.instructor.name}</p>
                        </div>
                        <div>
                          <Progress value={e.progress} className="h-1.5 mb-2.5" />
                          <div className="flex justify-between text-[12px] font-semibold text-muted">
                            <span>{e.progress}% complete</span>
                            <span>{e.course.totalLessons} lessons</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
