import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Loader2, Clock, Zap } from 'lucide-react'

interface VideoProcessingPlaceholderProps {
  status: 'queued' | 'processing'
  updatedAt?: number // timestamp from React Query
}

const TIPS = [
  'HLS segmenting for adaptive streaming…',
  'Generating multiple quality levels…',
  'Creating thumbnails…',
  'Optimising for fast delivery…',
  'Almost there — packaging segments…',
]

const QUEUED_TIPS = [
  'Your video is in the processing queue…',
  'Waiting for an available transcoder…',
  'You\'ll be notified when it\'s ready…',
]

export function VideoProcessingPlaceholder({ status, updatedAt }: VideoProcessingPlaceholderProps) {
  const [tipIndex, setTipIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [fakeProgress, setFakeProgress] = useState(status === 'processing' ? 5 : 0)

  // Rotate tip text every 3 seconds
  useEffect(() => {
    const tips = status === 'processing' ? TIPS : QUEUED_TIPS
    const t = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 3000)
    return () => clearInterval(t)
  }, [status])

  // Track how long we've been waiting since last poll
  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [updatedAt])

  // Animate a fake progress bar that never quite reaches 100%
  useEffect(() => {
    if (status !== 'processing') return
    const t = setInterval(() => {
      setFakeProgress(p => {
        if (p >= 90) return p // plateau near 90%
        return p + Math.random() * 1.2
      })
    }, 800)
    return () => clearInterval(t)
  }, [status])

  const tips = status === 'processing' ? TIPS : QUEUED_TIPS

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Subtle animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-64 h-64 rounded-full bg-primary blur-3xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm w-full text-center">
        {/* Animated icon */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-2xl border-2 border-primary/30 flex items-center justify-center"
          >
            <Film size={32} className="text-primary/60" />
          </motion.div>
          {/* Orbiting dot */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 absolute -top-1.5 left-1/2 -translate-x-1/2" />
          </motion.div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-1">
            {status === 'processing' ? 'Processing Video' : 'Video Queued'}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-white/40 text-xs">
            <Clock size={12} />
            <span>Checking every 5 seconds</span>
            {elapsed > 0 && (
              <span className="text-white/25">· {elapsed}s ago</span>
            )}
          </div>
        </div>

        {/* Progress bar (only during processing) */}
        {status === 'processing' && (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
              <span>Transcoding</span>
              <span className="tabular-nums">{Math.round(fakeProgress)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                animate={{ width: `${fakeProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-white/25 text-[11px] mt-1.5">
              Generating 360p · 480p · 720p · 1080p quality levels
            </p>
          </div>
        )}

        {/* Status dots */}
        <div className="flex items-center gap-3 text-white/50 text-xs">
          <StatusDot active={true} label="Upload" done />
          <div className="w-6 h-px bg-white/20" />
          <StatusDot active={status === 'processing'} label="Transcode" loading={status === 'processing'} />
          <div className="w-6 h-px bg-white/20" />
          <StatusDot active={false} label="Ready" />
        </div>

        {/* Rotating tip */}
        <div className="h-8 flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-white/35 text-xs flex items-center gap-1.5"
            >
              <Zap size={11} className="text-primary/50 shrink-0" />
              {tips[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center gap-2 text-white/25 text-[11px]">
          <Loader2 size={11} className="animate-spin" />
          <span>This page refreshes automatically — no need to reload</span>
        </div>
      </div>
    </div>
  )
}

function StatusDot({ active, label, done, loading }: { active: boolean; label: string; done?: boolean; loading?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
        done ? 'bg-green-500' : active ? 'bg-primary animate-pulse' : 'bg-white/15'
      }`} />
      <span className={`text-[10px] ${done ? 'text-green-500/70' : active ? 'text-primary/70' : 'text-white/20'}`}>
        {label}
      </span>
    </div>
  )
}
