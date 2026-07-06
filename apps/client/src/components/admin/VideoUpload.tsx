import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, CheckCircle2, Loader2, Film, AlertCircle, RefreshCw, XCircle, Cpu, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { uploadVideo } from '../../services/video.service'
import { cn } from '../../lib/utils'
import { useAlertStore } from '../../store/alertStore'
import { useProcessingStore } from '../../store/processingStore'
import { useVideoProgress } from '../../hooks/useVideoProgress'

interface VideoUploadProps {
  lessonId?: string
  initialUrl?: string
  onUploaded?: (url: string, durationSeconds: number) => void
  compact?: boolean
  confirmMessage?: string
  courseId?: string
  courseTitle?: string
  lessonTitle?: string
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : 0) }
    v.onerror = () => resolve(0)
    v.src = URL.createObjectURL(file)
  })
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

// Quality order for the checklist
const ALL_QUALITIES = ['360p', '480p', '720p', '1080p']

// Map progress % to a human stage label (used as fallback before WebSocket delivers a stage)
function progressToStage(pct: number): string {
  if (pct <= 2)  return 'Starting…'
  if (pct <= 5)  return 'Analysing video…'
  if (pct <= 10) return 'Generating thumbnails…'
  if (pct <= 30) return 'Transcoding 360p…'
  if (pct <= 50) return 'Transcoding 480p…'
  if (pct <= 70) return 'Transcoding 720p…'
  if (pct <= 90) return 'Transcoding 1080p…'
  if (pct <= 95) return 'Uploading to storage…'
  if (pct <= 98) return 'Saving to database…'
  return 'Finalising…'
}

export function VideoUpload({ lessonId, initialUrl, onUploaded, compact, confirmMessage, courseId, courseTitle, lessonTitle }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { showAlert } = useAlertStore()

  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [done, setDone] = useState(!!initialUrl)
  const [fileName, setFileName] = useState('')
  // The lesson ID that is currently being processed (may differ from prop after upload)
  const [processingLessonId, setProcessingLessonId] = useState<string | null>(() => {
    if (!lessonId) return null
    const job = useProcessingStore.getState().jobs.find(j => j.lessonId === lessonId && j.status !== 'ready')
    return job ? lessonId : null
  })
  const [processingJobId, setProcessingJobId] = useState<string | undefined>(() => {
    if (!lessonId) return undefined
    return useProcessingStore.getState().jobs.find(j => j.lessonId === lessonId && j.status !== 'ready')?.jobId
  })

  // WebSocket-powered real-time progress
  const progress = useVideoProgress(processingLessonId, processingJobId)

  // When processing completes, update done state
  useEffect(() => {
    if (progress.status === 'ready' && processingLessonId) {
      setDone(true)
      setProcessingLessonId(null)
      useProcessingStore.getState().updateJobStatus(processingLessonId, 'ready', 100)
      toast.success('🎉 Video processing complete! Students can now watch it.', { duration: 5000 })
    }
    if (progress.status === 'failed' && processingLessonId) {
      useProcessingStore.getState().updateJobStatus(processingLessonId, 'failed', 0)
      toast.error('Video processing failed. Please re-upload.')
    }
  }, [progress.status, processingLessonId])

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) { toast.error('Please select a video file'); return }
    setFileName(file.name)
    setUploadPct(0)
    setDone(false)
    setProcessingLessonId(null)

    try {
      const durationSeconds = await readVideoDuration(file)
      const result = await uploadVideo(file, lessonId, setUploadPct)
      setUploadPct(null)
      onUploaded?.('', durationSeconds)

      const lid = result.lessonId || lessonId
      if (lid) {
        setProcessingLessonId(lid)
        setProcessingJobId(result.jobId)
        // Register in global store for course page badge
        if (courseId && courseTitle && lessonTitle) {
          useProcessingStore.getState().addJob({ lessonId: lid, courseId, courseTitle, lessonTitle, jobId: result.jobId })
        }
        toast.success('✅ Uploaded! Processing in the background — you can save and come back.', { duration: 5000 })
      } else {
        setDone(true)
        toast.success('Video uploaded.')
      }
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      setUploadPct(null)
      toast.error(err.response?.data?.message || 'Upload failed — please try again.')
    }
  }

  const openPicker = () => {
    if (done || processingLessonId) {
      showAlert({
        title: processingLessonId ? 'Cancel Processing & Replace?' : 'Replace Video?',
        message: confirmMessage || 'This will replace the current video. The existing processing pipeline will be overwritten.',
        confirmText: 'Replace Video',
        danger: true,
        onConfirm: () => {
          if (processingLessonId) {
            useProcessingStore.getState().removeJob(processingLessonId)
          }
          setProcessingLessonId(null)
          setDone(false)
          inputRef.current?.click()
        }
      })
      return
    }
    inputRef.current?.click()
  }

  const handleDrop = (file: File) => {
    if (done || processingLessonId) {
      showAlert({
        title: 'Replace Video?',
        message: confirmMessage || 'This will replace the current video. Continue?',
        confirmText: 'Replace Video',
        danger: true,
        onConfirm: () => { setProcessingLessonId(null); setDone(false); handleFile(file) }
      })
      return
    }
    handleFile(file)
  }

  const uploading = uploadPct !== null
  const isProcessing = !!processingLessonId && progress.status !== 'ready' && progress.status !== 'failed'
  const isFailed = progress.status === 'failed' && !!processingLessonId

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESSING PANEL — shown after upload while HLS is being generated
  // ─────────────────────────────────────────────────────────────────────────
  if (processingLessonId) {
    const pct = progress.percent
    const stage = progress.stage || progressToStage(pct)
    const isReady = progress.status === 'ready'

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl border bg-canvas overflow-hidden',
          isReady ? 'border-green-500/40' :
          isFailed ? 'border-danger/40' : 'border-line'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-line',
          isReady ? 'bg-green-500/8' : isFailed ? 'bg-danger/8' : 'bg-primary/5'
        )}>
          <div className="flex items-center gap-2.5">
            {isFailed ? (
              <XCircle size={15} className="text-danger" />
            ) : isReady ? (
              <CheckCircle2 size={15} className="text-green-500" />
            ) : (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Cpu size={15} className="text-primary" />
              </motion.div>
            )}
            <span className="text-[13px] font-bold text-fg">
              {isFailed ? 'Processing Failed' : isReady ? '✓ Video Ready' : 'Processing Video…'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isProcessing && progress.elapsedMs > 0 && (
              <span className="text-[10px] text-muted flex items-center gap-1 tabular-nums">
                <Clock size={9} /> {formatElapsed(progress.elapsedMs)}
              </span>
            )}
            {/* Connection indicator */}
            <span className={cn('text-[9px] flex items-center gap-1', progress.connected ? 'text-green-500' : 'text-muted')}>
              <span className={cn('w-1.5 h-1.5 rounded-full', progress.connected ? 'bg-green-500 animate-pulse' : 'bg-muted')} />
              {progress.connected ? 'Live' : 'Reconnecting…'}
            </span>
            <button type="button" onClick={openPicker} className="text-[10px] text-muted hover:text-fg flex items-center gap-1 transition-colors">
              <RefreshCw size={9} /> Replace
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Progress bar + stage */}
          {!isFailed && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted font-medium">{isReady ? 'Complete' : stage}</span>
                <span className="text-[11px] font-bold tabular-nums text-primary">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', isReady ? 'bg-green-500' : 'bg-gradient-to-r from-primary/60 to-primary')}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Quality checklist — derived from completedQualities from the socket */}
          {!isFailed && (
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_QUALITIES.map(q => {
                const done = progress.completedQualities.includes(q)
                const active = isProcessing && !done && stage.toLowerCase().includes(q.toLowerCase())
                return (
                  <span key={q} className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums transition-all',
                    done  ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                    active ? 'bg-primary/10 border-primary/30 text-primary' :
                             'bg-surface2 border-line text-subtle opacity-50'
                  )}>
                    {done ? '✓' : active ? '⏳' : '○'} {q}
                  </span>
                )
              })}
            </div>
          )}

          {/* Success / Failure banners */}
          {isReady && (
            <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
              HLS segments &amp; adaptive quality levels ready. Students can now stream this video.
            </p>
          )}
          {isFailed && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-danger/10 border border-danger/20">
              <AlertCircle size={13} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-danger">Processing failed</p>
                <p className="text-[11px] text-danger/70">Something went wrong. Please re-upload the video.</p>
              </div>
            </div>
          )}

          {/* Hint */}
          {isProcessing && (
            <p className="text-[10px] text-muted/50">
              Processing in background — you can save the lecture and come back later.
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEFAULT UPLOAD DROPZONE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && handleDrop(e.dataTransfer.files[0]) }}
        className={cn(
          'w-full flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 transition-colors hover:border-primary hover:bg-surface2 disabled:opacity-60',
          compact ? 'py-2.5' : 'py-6 flex-col justify-center text-center'
        )}
      >
        {uploading ? (
          <Loader2 size={compact ? 16 : 22} className="animate-spin text-primary" />
        ) : done ? (
          <CheckCircle2 size={compact ? 16 : 22} className="text-success" />
        ) : compact ? (
          <Film size={16} className="text-muted" />
        ) : (
          <UploadCloud size={22} className="text-muted" />
        )}
        <div className={compact ? 'text-left' : ''}>
          <p className="text-sm font-medium">
            {uploading
              ? `Uploading… ${uploadPct}%`
              : done
                ? 'Video ready — Click to replace'
                : compact
                  ? 'Upload / replace video'
                  : 'Click or drag a video to upload'}
          </p>
          {!compact && !uploading && <p className="text-xs text-muted mt-0.5">MP4, WebM, MOV up to 500MB</p>}
          {fileName && !compact && <p className="text-xs text-subtle mt-1 truncate max-w-xs">{fileName}</p>}
        </div>
      </button>

      {uploading && (
        <div className="h-1.5 mt-2 rounded-full bg-surface2 overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${uploadPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  )
}
