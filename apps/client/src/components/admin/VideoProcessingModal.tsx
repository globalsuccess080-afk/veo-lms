import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, XCircle, Clock, Cpu, AlertCircle, Loader2 } from 'lucide-react'
import { useProcessingStore, ProcessingJob } from '../../store/processingStore'
import { useVideoProgress } from '../../hooks/useVideoProgress'
import { cn } from '../../lib/utils'

interface VideoProcessingModalProps {
  courseId: string
  courseTitle: string
  isOpen: boolean
  onClose: () => void
}

const ALL_QUALITIES = ['360p', '480p', '720p', '1080p']

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

/** Per-job card that subscribes to WebSocket progress for its lessonId */
function JobCard({ job }: { job: ProcessingJob }) {
  const updateJobStatus = useProcessingStore(s => s.updateJobStatus)
  const removeJob = useProcessingStore(s => s.removeJob)

  // Only subscribe to WS if the job is still active
  const activeLessonId = (job.status === 'queued' || job.status === 'processing') ? job.lessonId : null
  const progress = useVideoProgress(activeLessonId, job.jobId)

  // Sync WS state → global store
  useEffect(() => {
    if (!activeLessonId) return
    if (progress.status === 'ready') {
      updateJobStatus(job.lessonId, 'ready', 100)
      setTimeout(() => removeJob(job.lessonId), 30000)
    } else if (progress.status === 'failed') {
      updateJobStatus(job.lessonId, 'failed', 0)
    } else if (progress.percent > 0) {
      updateJobStatus(job.lessonId, 'processing', progress.percent)
    }
  }, [progress.status, progress.percent, activeLessonId, job.lessonId, updateJobStatus, removeJob])

  const pct = job.status === 'ready' ? 100 : (progress.percent || job.progress || 0)
  const stage = progress.stage || (job.status === 'queued' ? 'Waiting in queue…' : 'Processing…')
  const elapsedMs = progress.elapsedMs || (Date.now() - job.startedAt)
  const completedQualities = progress.completedQualities || []
  const isReady = job.status === 'ready'
  const isFailed = job.status === 'failed'
  const isActive = job.status === 'queued' || job.status === 'processing'

  return (
    <div className="rounded-xl border border-line bg-canvas p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-fg truncate">{job.lessonTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              isReady  ? 'bg-green-500/10 text-green-500' :
              isFailed ? 'bg-danger/10 text-danger' :
              isActive ? 'bg-primary/10 text-primary' :
                         'bg-surface2 text-muted'
            )}>
              {isReady  ? 'Ready ✓' :
               isFailed ? 'Failed ✗' :
               job.status === 'queued' ? 'Queued' :
               `${Math.round(pct)}%`}
            </span>
            {isActive && elapsedMs > 0 && (
              <span className="text-[10px] text-muted flex items-center gap-0.5">
                <Clock size={9} /> {formatMs(elapsedMs)}
              </span>
            )}
          </div>
        </div>
        {isReady && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
        {isFailed && <XCircle size={16} className="text-danger shrink-0" />}
        {isActive && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={16} className="text-primary shrink-0" />
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted">{isReady ? 'Complete' : stage}</span>
            <span className="text-[10px] font-bold text-primary tabular-nums">{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', isReady ? 'bg-green-500' : 'bg-gradient-to-r from-primary/60 to-primary')}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Quality badges */}
      {!isFailed && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_QUALITIES.map(q => {
            const done = completedQualities.includes(q) || isReady
            const active = isActive && stage.toLowerCase().includes(q.toLowerCase())
            return (
              <span key={q} className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums',
                done   ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                active ? 'bg-primary/10 border-primary/30 text-primary' :
                         'bg-surface2 border-line text-subtle opacity-50'
              )}>
                {done ? '✓' : active ? '⏳' : '○'} {q}
              </span>
            )
          })}
        </div>
      )}

      {isFailed && (
        <p className="text-[11px] text-danger/70 flex items-center gap-1">
          <AlertCircle size={11} /> Re-upload the video in the course editor.
        </p>
      )}
    </div>
  )
}

export function VideoProcessingModal({ courseId, courseTitle, isOpen, onClose }: VideoProcessingModalProps) {
  const allJobs = useProcessingStore(s => s.jobs)
  const jobs = allJobs.filter(j => j.courseId === courseId)

  const activeCount = jobs.filter(j => j.status === 'queued' || j.status === 'processing').length
  const doneCount   = jobs.filter(j => j.status === 'ready').length
  const failedCount = jobs.filter(j => j.status === 'failed').length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 flex flex-col bg-canvas border border-line shadow-2xl sm:rounded-2xl sm:max-w-2xl w-full sm:max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={activeCount > 0 ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Cpu size={17} className="text-primary shrink-0" />
                  </motion.div>
                  <h2 className="text-[15px] font-bold text-fg">Video Processing</h2>
                </div>
                <p className="text-[12px] text-muted mt-0.5 truncate">{courseTitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  {activeCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                      <Loader2 size={9} className="animate-spin" /> {activeCount} processing
                    </span>
                  )}
                  {doneCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                      {doneCount} ready
                    </span>
                  )}
                  {failedCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                      {failedCount} failed
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-surface2 transition-colors"
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-green-500" />
                  <p className="text-[14px] font-medium">All videos are ready</p>
                  <p className="text-[12px] mt-1">No videos are currently processing for this course.</p>
                </div>
              ) : (
                jobs.map(job => <JobCard key={job.lessonId} job={job} />)
              )}
            </div>

            {/* Footer */}
            {activeCount > 0 && (
              <div className="px-5 py-3 border-t border-line bg-surface/50 shrink-0">
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live updates via WebSocket — no polling, no page reloads needed.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
