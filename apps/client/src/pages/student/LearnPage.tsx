import { useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, PanelRightClose, PanelRightOpen, PlayCircle, Lock, ShoppingBag, Award } from 'lucide-react'
import { getCourse, getCurriculum } from '../../services/course.service'
import { getLesson, getVideoUrl } from '../../services/lesson.service'
import { getCourseProgress, updateProgress, getLessonProgress } from '../../services/progress.service'
import { VideoPlayer, type VideoPlayerHandle } from '../../components/player/VideoPlayer'
import { LessonTabs } from '../../components/learn/LessonTabs'
import { formatDuration, cn } from '../../lib/utils'
import { Button, buttonClass } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Skeleton } from '../../components/ui/Skeleton'
import { getMyEnrollments } from '../../services/enrollment.service'
import { LearnSkeleton } from '../../components/skeletons/student/LearnSkeleton'
import { VideoProcessingPlaceholder } from '../../components/player/VideoProcessingPlaceholder'

interface CLesson { id: string; title: string; duration: number; isPreview: boolean }
interface CSection { _id: string; title: string; lessons: CLesson[] }

export function LearnPage() {
    const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId?: string }>()
    const navigate = useNavigate()
    const [activeLessonId, setActiveLessonId] = useState(lessonId || '')
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const playerRef = useRef<VideoPlayerHandle>(null)

    const toggleCollapse = (sid: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev)
            next.has(sid) ? next.delete(sid) : next.add(sid)
            return next
        })

    const { data: course } = useQuery({ queryKey: ['course', courseSlug], queryFn: () => getCourse(courseSlug!), enabled: !!courseSlug })
    const { data: curriculum } = useQuery({ queryKey: ['curriculum', courseSlug], queryFn: () => getCurriculum(courseSlug!), enabled: !!courseSlug })

    const sections: CSection[] = curriculum?.sections || []
    const allLessons = sections.flatMap((s) => s.lessons)
    const currentLessonId = activeLessonId || allLessons[0]?.id
    const currentLesson = allLessons.find((l) => l.id === currentLessonId)

    const { data: lesson } = useQuery({ queryKey: ['lesson', currentLessonId], queryFn: () => getLesson(currentLessonId), enabled: !!currentLessonId })
    const { data: video, dataUpdatedAt: videoUpdatedAt } = useQuery({
        queryKey: ['video', currentLessonId],
        queryFn: () => getVideoUrl(currentLessonId),
        enabled: !!currentLessonId,
        // Poll every 5s while video is still processing, stop once ready
        refetchInterval: (query) => {
            const data = query.state.data as any
            if (!data) return false
            const status = data?.status
            return (status === 'queued' || status === 'processing') ? 5000 : false
        },
        refetchIntervalInBackground: false,
    })
    const { data: savedProgress } = useQuery({ queryKey: ['lesson-progress', currentLessonId], queryFn: () => getLessonProgress(currentLessonId), enabled: !!currentLessonId })
    const { data: courseProgress, refetch } = useQuery({ queryKey: ['course-progress', course?.id], queryFn: () => getCourseProgress(course!.id), enabled: !!course?.id })
    const { data: enrollments } = useQuery({ queryKey: ['my-enrollments'], queryFn: getMyEnrollments })

    const isEnrolled = enrollments?.some((e: any) => e.courseId === course?.id || e.course?._id === course?.id || e.course?.id === course?.id)

    const handleProgress = useCallback(async (seconds: number, completed: boolean) => {
        if (!course || !currentLessonId || !lesson) return
        await updateProgress({ courseId: course.id, lessonId: currentLessonId, watchedSeconds: seconds, totalSeconds: lesson.duration, isCompleted: completed })
        refetch()
    }, [course, currentLessonId, lesson, refetch])

    const selectLesson = (id: string) => {
        setActiveLessonId(id)
        navigate(`/learn/${courseSlug}/${id}`, { replace: true })
    }

    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId)
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

    const markComplete = async (auto: boolean) => {
        if (!course || !currentLessonId || !lesson) return
        await updateProgress({ courseId: course.id, lessonId: currentLessonId, watchedSeconds: lesson.duration, totalSeconds: lesson.duration, isCompleted: true })
        refetch()
        toast.success('Lesson completed!')
        if (auto && nextLesson) selectLesson(nextLesson.id)
    }

    const completedIds = new Set((courseProgress || []).filter((p: { isCompleted: boolean }) => p.isCompleted).map((p: { lessonId: string }) => p.lessonId))
    const isDone = (id: string) => completedIds.has(id)
    const pct = allLessons.length ? Math.round((completedIds.size / allLessons.length) * 100) : 0

    const pickLesson = (id: string) => {
        selectLesson(id)
        if (window.innerWidth < 1024) setSidebarOpen(false)
    }

    const sidebarBody = (
        <div>
            {sections.map((section, si) => {
                const isOpen = !collapsed.has(section._id)
                const sectionDone = section.lessons.filter((l) => isDone(l.id)).length
                const sectionDuration = section.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
                return (
                    <div key={section._id} className="border-b border-line">
                        <button
                            onClick={() => toggleCollapse(section._id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface2/60 transition-colors"
                        >
                            <ChevronDown size={16} className={cn('text-muted shrink-0 transition-transform', !isOpen && '-rotate-90')} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">Section {si + 1}: {section.title}</p>
                                <p className="text-xs text-subtle mt-0.5">{sectionDone} / {section.lessons.length} · {formatDuration(sectionDuration)}</p>
                            </div>
                        </button>
                        {isOpen && (
                            <div className="pb-1">
                                {section.lessons.map((l, li) => {
                                    const active = l.id === currentLessonId
                                    return (
                                        <button
                                            key={l.id}
                                            onClick={() => pickLesson(l.id)}
                                            className={cn(
                                                'w-full flex items-start gap-3 pl-4 pr-3 py-2.5 text-left text-sm transition-colors relative',
                                                active ? 'bg-primary-subtle' : 'hover:bg-surface2/60'
                                            )}
                                        >
                                            {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                                            <span className="mt-0.5 shrink-0">
                                                {!isEnrolled && !l.isPreview ? (
                                                    <Lock size={16} className="text-muted" />
                                                ) : isDone(l.id) ? (
                                                    <CheckCircle2 size={17} className="text-success" />
                                                ) : active ? (
                                                    <PlayCircle size={17} className="text-primary" />
                                                ) : (
                                                    <Circle size={17} className="text-subtle" />
                                                )}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className={cn('block leading-snug line-clamp-2', active ? 'text-primary font-medium' : 'text-fg')}>
                                                    {li + 1}. {l.title}
                                                </span>
                                                <span className="text-xs text-subtle">{formatDuration(l.duration)}{l.isPreview ? ' · Preview' : ''}</span>
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )

    if (!course) return <LearnSkeleton />

    return (
        <div className="h-screen flex flex-col bg-canvas overflow-hidden">
            <header className="h-14 border-b border-line glass z-30 flex items-center gap-3 px-3 sm:px-4 shrink-0">
                <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors shrink-0">
                    <ArrowLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <span className="text-line hidden sm:inline">|</span>
                <h1 className="font-semibold text-sm truncate flex-1">{course.title}</h1>
                <div className="hidden md:flex items-center gap-2 w-40">
                    <Progress value={pct} />
                    <span className="text-xs text-muted shrink-0">{pct}%</span>
                </div>
                <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors shrink-0"
                    title="Toggle course content"
                >
                    {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                    <span className="hidden lg:inline text-xs">{sidebarOpen ? 'Hide' : 'Show'} content</span>
                </button>
            </header>

            <div className="flex flex-1 min-h-0">
                <main className="flex-1 overflow-y-auto min-w-0">
                    {lesson && video ? (
                        <>
                            <div className="relative bg-black w-full">
                                <div className="w-full aspect-video md:aspect-auto md:h-[calc(100vh-3.5rem-150px)]">
                                    {/* ── Video Processing Placeholder ──────────────────────────── */}
                                    {video.status === 'queued' || video.status === 'processing' ? (
                                        <VideoProcessingPlaceholder
                                            status={video.status}
                                            updatedAt={videoUpdatedAt}
                                        />
                                    ) : (
                                        <VideoPlayer
                                            ref={playerRef}
                                            key={currentLessonId}
                                            youtubeUrl={video.youtubeUrl}
                                            fileUrl={video.fileUrl}
                                            durationHint={lesson.duration}
                                            poster={video.thumbnailUrl || video.thumbnail?.medium || video.thumbnail?.large || video.thumbnail?.small || undefined}
                                            // If lesson is completed, always start from beginning
                                            savedPosition={isDone(currentLessonId) ? 0 : (savedProgress?.watchedSeconds || 0)}
                                            onProgress={handleProgress}
                                            onEnded={() => markComplete(true)}
                                            onToggleTheater={() => setSidebarOpen((v) => !v)}
                                            theater={!sidebarOpen}
                                            fill
                                        />
                                    )}
                                </div>

                                {prevLesson && (
                                    <button
                                        onClick={() => selectLesson(prevLesson.id)}
                                        title={`Previous: ${prevLesson.title}`}
                                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-9 h-12 rounded-lg bg-primary/90 text-primary-fg grid place-items-center shadow-lg hover:bg-primary transition-colors"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                )}
                                {nextLesson && (
                                    <button
                                        onClick={() => selectLesson(nextLesson.id)}
                                        title={`Next: ${nextLesson.title}`}
                                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-9 h-12 rounded-lg bg-primary/90 text-primary-fg grid place-items-center shadow-lg hover:bg-primary transition-colors"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                )}
                            </div>

                            <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
                                <div className="flex items-start justify-between gap-4">
                                    <h2 className="text-xl sm:text-2xl font-bold">{lesson.title}</h2>
                                    {isDone(currentLessonId) ? (
                                        <span className="flex items-center gap-1.5 text-sm text-success font-medium shrink-0 mt-1">
                                            <CheckCircle2 size={18} /> <span className="hidden sm:inline">Completed</span>
                                        </span>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => markComplete(false)} className="shrink-0 mt-1">
                                            <CheckCircle2 size={16} /> <span className="hidden sm:inline">Mark as complete</span>
                                        </Button>
                                    )}
                                </div>

                                <LessonTabs
                                    courseId={course.id}
                                    lessonId={currentLessonId}
                                    description={lesson.description}
                                    resources={lesson.resources || []}
                                    getCurrentTime={() => playerRef.current?.getCurrentTime() || 0}
                                    onSeek={(s) => playerRef.current?.seek(s)}
                                />
                            </div>
                        </>
                    ) : !isEnrolled && currentLesson && !currentLesson.isPreview ? (
                        <div className="w-full aspect-video md:aspect-auto md:h-[calc(100vh-3.5rem-150px)] bg-surface border-b border-line flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
                                style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="relative z-10 flex flex-col items-center max-w-[420px]"
                            >
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform hover:scale-105 duration-300"
                                    style={{ background: 'var(--primary-subtle)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}>
                                    <Lock size={34} style={{ color: 'var(--primary)' }} strokeWidth={2} />
                                </div>

                                <h2 className="text-[1.6rem] sm:text-[1.8rem] font-extrabold mb-3 tracking-tight leading-tight" style={{ color: 'var(--fg)' }}>
                                    Unlock Premium Content
                                </h2>
                                <p className="mb-8 text-[14.5px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                                    This lesson is part of the <strong style={{ color: 'var(--fg)' }}>{course.title}</strong> curriculum. Enroll now to get lifetime access to all high-quality video lessons, resources, and community discussions.
                                </p>

                                <Link
                                    to={`/courses/${course.slug}`}
                                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <ShoppingBag size={18} className="mr-2" />
                                    Purchase Course
                                </Link>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="w-full aspect-video md:aspect-auto md:h-[calc(100vh-3.5rem-150px)] skeleton" />
                    )}
                </main>

                {/* Desktop sidebar */}
                {sidebarOpen && (
                    <aside className="hidden lg:flex flex-col w-[340px] border-l border-line bg-surface shrink-0 min-h-0">
                        <div className="p-4 border-b border-line shrink-0">
                            <p className="font-semibold text-sm">Course content</p>
                            <p className="text-xs text-muted mt-0.5">{completedIds.size} of {allLessons.length} lessons completed</p>
                        </div>
                        <div className="overflow-y-auto flex-1">{sidebarBody}</div>
                        {isEnrolled && (
                            <div className="p-4 border-t border-line shrink-0">
                                <Link to={`/courses/${course.slug}/certificate`} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold transition-colors text-sm">
                                    <Award size={18} /> Course Certificate
                                </Link>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Mobile drawer */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
                    <aside className="w-[86%] max-w-sm bg-surface flex flex-col h-full shadow-pop">
                        <div className="p-4 border-b border-line flex items-center justify-between shrink-0">
                            <div>
                                <p className="font-semibold text-sm">Course content</p>
                                <p className="text-xs text-muted mt-0.5">{completedIds.size} of {allLessons.length} lessons completed</p>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="text-subtle hover:text-fg transition-colors">
                                <PanelRightClose size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">{sidebarBody}</div>
                        {isEnrolled && (
                            <div className="p-4 border-t border-line shrink-0 mb-4">
                                <Link to={`/courses/${course.slug}/certificate`} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold transition-colors text-sm">
                                    <Award size={18} /> Course Certificate
                                </Link>
                            </div>
                        )}
                    </aside>
                </div>
            )}
        </div>
    )
}


