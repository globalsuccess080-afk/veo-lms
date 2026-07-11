import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { BookOpen, CheckCircle2, TrendingUp, Clock, ArrowRight, PlayCircle, Sparkles, Award, ExternalLink } from 'lucide-react'
import { getMyEnrollments } from '../../services/enrollment.service'
import { getRecentProgress } from '../../services/progress.service'
import { getMyCertificates, type Certificate } from '../../services/certificate.service'
import { useAuthStore } from '../../store/authStore'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Progress } from '../../components/ui/Progress'
import { EmptyState } from '../../components/ui/EmptyState'
import { buttonClass } from '../../components/ui/Button'
import { StudentDashboardSkeleton } from '../../components/skeletons/student/StudentDashboardSkeleton'
import { LearningStreakCard } from '../../components/student/LearningStreakCard'
import { resolveAssetUrl } from '../../lib/assets'

interface EnrollmentItem {
  id: string
  progress: number
  course: { title: string; slug: string; thumbnail: string; totalLessons: number; instructor: { name: string } }
}
interface RecentItem {
  lessonId: { title: string } | null
  courseId: { title: string; slug: string; thumbnail: string }
  watchedSeconds: number
  totalSeconds: number
  isCompleted: boolean
}

const FADE_DOWN: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const ITEM_VAR: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function formatCertificateDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: rawEnrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentItem[]>({ queryKey: ['my-enrollments'], queryFn: getMyEnrollments })
  const { data: rawRecent, isLoading: recentLoading } = useQuery<RecentItem[]>({ queryKey: ['recent-progress'], queryFn: getRecentProgress })
  const { data: rawCertificates } = useQuery<Certificate[]>({ queryKey: ['my-certificates'], queryFn: getMyCertificates })

  if (enrollmentsLoading || recentLoading) {
    return <StudentDashboardSkeleton />
  }

  const enrollments = rawEnrollments?.filter(e => e?.course) || []
  const recent = rawRecent?.filter(r => r?.courseId) || []
  const latestCertificates = (rawCertificates || []).filter((c) => c?.courseId).slice(0, 3)

  const completed = recent.filter((r) => r.isCompleted).length
  const total = enrollments.length
  const finished = enrollments.filter((e) => e.progress === 100).length

  const stats = [
    { icon: BookOpen, label: 'Enrolled Courses', value: total },
    { icon: CheckCircle2, label: 'Lessons Completed', value: completed },
    { icon: TrendingUp, label: 'In Progress', value: total - finished },
    { icon: Clock, label: 'Finished Courses', value: finished }
  ]

  return (
    <PageWrapper className="relative min-h-screen overflow-hidden">
      {/* Background Decorators - Theme Aware */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-[20%] w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.08] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={STAGGER_CONTAINER}
        className="relative z-10 max-w-[1400px] mx-auto px-6 py-10 lg:py-14"
      >
        {/* Header Section */}
        <motion.div variants={FADE_DOWN} className="mb-14 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-4"
            style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
            <Sparkles size={12} /> Welcome Back
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--fg)' }}>
            Ready to learn, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0]}</span>?
          </h1>
          <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
            Pick up where you left off or discover new skills to master today.
          </p>
        </motion.div>

        {/* Learning Streak Section */}
        <LearningStreakCard />

        {/* Stats Grid */}
        <motion.div variants={STAGGER_CONTAINER} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={ITEM_VAR}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-2xl p-6 group transition-all shadow-sm hover:shadow-md"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
              
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300"
                style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}>
                <s.icon size={20} strokeWidth={2.5} />
              </div>
              
              <div className="relative z-10">
                <p className="text-[2.2rem] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: 'var(--fg)' }}>
                  {s.value}
                </p>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-subtle)' }}>
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Latest Certificates */}
        {latestCertificates.length > 0 && (
          <motion.section variants={STAGGER_CONTAINER} className="mb-16">
            <motion.div variants={ITEM_VAR} className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[1.35rem] font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                  <Award size={20} className="text-primary" /> Latest Certificates
                </h2>
                <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--fg-muted)' }}>Your newest verified achievements</p>
              </div>
              <Link to="/profile#certificates" className="hidden sm:flex text-[13px] font-bold items-center gap-1.5 hover:underline transition-colors" style={{ color: 'var(--primary)' }}>
                View all <ArrowRight size={16} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {latestCertificates.map((cert) => (
                <motion.div
                  key={cert.certificateId}
                  variants={ITEM_VAR}
                  whileHover={{ y: -5 }}
                  className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-sm"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-success to-info" />
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-primary/10" />
                  <div className="p-5 relative">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="h-11 w-11 rounded-xl bg-primary-subtle border border-primary/20 grid place-items-center text-primary shrink-0">
                        <Award size={22} strokeWidth={2.4} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-1">Verified</p>
                        <h3 className="font-extrabold text-[15px] leading-snug line-clamp-2 text-fg">{cert.courseId.title}</h3>
                      </div>
                    </div>
                    <div className="rounded-xl bg-canvas/70 border border-line/70 p-3 mb-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-muted">Issued</span>
                        <span className="text-[12px] font-bold text-fg">{formatCertificateDate(cert.issuedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-2">
                        <span className="text-[11px] font-semibold text-muted">Certificate ID</span>
                        <span className="text-[11px] font-mono font-bold text-fg truncate">{cert.certificateId}</span>
                      </div>
                    </div>
                    <Link
                      to={`/certificate/${cert.certificateId}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-[13px] font-bold text-primary-fg hover:bg-primary-hover transition-colors"
                    >
                      View certificate <ExternalLink size={14} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Continue Learning Section */}
        {recent && recent.length > 0 && (
          <motion.section variants={STAGGER_CONTAINER} className="mb-16">
            <motion.h2 variants={ITEM_VAR} className="text-[1.35rem] font-bold mb-6 tracking-tight flex items-center gap-2" style={{ color: 'var(--fg)' }}>
              Continue Learning
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.slice(0, 3).map((item, i) => {
                const progressPct = item.isCompleted ? 100 : item.totalSeconds ? Math.min(100, (item.watchedSeconds / item.totalSeconds) * 100) : 0
                return (
                  <Link key={i} to={`/learn/${item.courseId.slug}`}>
                    <motion.div
                      variants={ITEM_VAR}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 flex gap-4 items-center rounded-2xl group transition-all cursor-pointer relative overflow-hidden"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-50" />
                      <div className="relative w-[110px] h-[74px] rounded-xl overflow-hidden shrink-0">
                        <img src={resolveAssetUrl(item.courseId.thumbnail)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <PlayCircle size={28} className="text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-[14px] truncate mb-1 transition-colors group-hover:text-primary" style={{ color: 'var(--fg)' }}>
                          {item.lessonId?.title || item.courseId.title}
                        </p>
                        <p className="text-[12px] font-medium truncate mb-3" style={{ color: 'var(--fg-muted)' }}>
                          {item.courseId.title}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Progress className="h-1.5" value={progressPct} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: 'var(--fg-subtle)' }}>
                            {Math.round(progressPct)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* My Courses Section */}
        <motion.section variants={STAGGER_CONTAINER}>
          <motion.div variants={ITEM_VAR} className="flex items-center justify-between mb-6">
            <h2 className="text-[1.35rem] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>My Courses</h2>
            <Link to="/my-courses" className="text-[13px] font-bold flex items-center gap-1.5 hover:underline transition-colors" style={{ color: 'var(--primary)' }}>
              View all <ArrowRight size={16} />
            </Link>
          </motion.div>

          {!enrollments || enrollments.length === 0 ? (
            <motion.div variants={ITEM_VAR} className="rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Browse our catalog and enroll in your first course."
                action={<Link to="/search" className={buttonClass('primary', 'md') + " font-bold"}>Browse Courses</Link>}
              />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrollments.map((e) => (
                <Link key={e.id} to={`/learn/${e.course.slug}`}>
                  <motion.div
                    variants={ITEM_VAR}
                    whileHover={{ y: -6 }}
                    className="overflow-hidden rounded-2xl group transition-all h-full flex flex-col"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="relative overflow-hidden aspect-[16/9]">
                      <img src={resolveAssetUrl(e.course.thumbnail)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-[15px] mb-1.5 line-clamp-2 transition-colors group-hover:text-primary leading-snug" style={{ color: 'var(--fg)' }}>
                        {e.course.title}
                      </h3>
                      <p className="text-[12px] font-medium mb-auto" style={{ color: 'var(--fg-muted)' }}>
                        {e.course.instructor.name}
                      </p>
                      
                      <div className="mt-5 pt-4" style={{ borderTop: '1px dashed var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--fg-subtle)' }}>Progress</p>
                          <p className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>{e.progress}%</p>
                        </div>
                        <Progress value={e.progress} className="h-1.5" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>
    </PageWrapper>
  )
}
