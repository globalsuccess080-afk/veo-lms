import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize,
  RotateCcw, RotateCw, Settings, Check, Captions, Tv2,
  PictureInPicture2, SkipBack, SkipForward, ChevronLeft,
} from 'lucide-react'
import Hls from 'hls.js'

export interface VideoPlayerHandle {
  seek: (seconds: number) => void
  getCurrentTime: () => number
}

interface VideoPlayerProps {
  youtubeUrl?: string
  fileUrl?: string
  poster?: string
  savedPosition?: number
  onProgress: (seconds: number, completed: boolean) => void
  onEnded: () => void
  onToggleTheater?: () => void
  theater?: boolean
  fill?: boolean
  durationHint?: number
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const SEEK_STEP = 10

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { youtubeUrl, fileUrl, poster, savedPosition = 0, onProgress, onEnded, onToggleTheater, theater, fill, durationHint },
  ref
) {
  if (fileUrl) {
    return (
      <FilePlayer
        ref={ref}
        fileUrl={fileUrl}
        poster={poster}
        savedPosition={savedPosition}
        onProgress={onProgress}
        onEnded={onEnded}
        onToggleTheater={onToggleTheater}
        theater={theater}
        fill={fill}
        durationHint={durationHint}
      />
    )
  }
  if (youtubeUrl) {
    return <YouTubePlayer ref={ref} youtubeUrl={youtubeUrl} savedPosition={savedPosition} onProgress={onProgress} onEnded={onEnded} fill={fill} />
  }
  return (
    <div className="aspect-video grid place-items-center bg-surface2 text-muted rounded-lg text-sm">
      No video available for this lesson yet.
    </div>
  )
})

type Flash = { dir: -1 | 1; id: number; amount: number }
type Pulse = { type: 'play' | 'pause'; id: number }

type FilePlayerProps = Required<Pick<VideoPlayerProps, 'fileUrl' | 'onProgress' | 'onEnded'>> & {
  poster?: string
  savedPosition: number
  onToggleTheater?: () => void
  theater?: boolean
  fill?: boolean
  durationHint?: number
}

const FilePlayer = forwardRef<VideoPlayerHandle, FilePlayerProps>(function FilePlayer(
  { fileUrl, poster, savedPosition, onProgress, onEnded, onToggleTheater, theater, fill, durationHint = 0 },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [seeking, setSeeking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(durationHint > 0 ? durationHint : 0)
  const [buffered, setBuffered] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main')
  const [qualityLevels, setQualityLevels] = useState<{ height: number; index: number }[]>([])
  const [currentQuality, setCurrentQuality] = useState<number>(-1)
  const [captionsOn, setCaptionsOn] = useState(false)
  const [hasCaptionTracks, setHasCaptionTracks] = useState(false)
  const [isFs, setIsFs] = useState(false)
  const [isPip, setIsPip] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null)
  const [flash, setFlash] = useState<Flash | null>(null)
  const [pulse, setPulse] = useState<Pulse | null>(null)
  const [volumeOsd, setVolumeOsd] = useState<{ vol: number; id: number } | null>(null)

  const volumeOsdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSave = useRef(0)
  const onProgressRef = useRef(onProgress)
  const onEndedRef = useRef(onEnded)
  onProgressRef.current = onProgress
  onEndedRef.current = onEnded

  const syncDuration = useCallback((candidate?: number) => {
    const mediaDuration = candidate ?? videoRef.current?.duration ?? 0
    const next = Number.isFinite(mediaDuration) && mediaDuration > 0
      ? mediaDuration
      : durationHint > 0
        ? durationHint
        : 0
    if (next > 0) setDuration(next)
  }, [durationHint])

  // Stable refs for use in event handlers (avoid stale closures)
  const playingRef = useRef(playing)
  const durationRef = useRef(duration)
  const captionsOnRef = useRef(captionsOn)
  const volumeRef = useRef(volume)
  playingRef.current = playing
  durationRef.current = duration
  captionsOnRef.current = captionsOn
  volumeRef.current = volume

  useImperativeHandle(ref, () => ({
    seek: (seconds: number) => {
      const v = videoRef.current
      if (v) { v.currentTime = seconds; v.play().catch(() => null) }
    },
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
  }))

  // ── HLS source wiring ────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video || !fileUrl) return

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    setQualityLevels([])
    setCurrentQuality(-1)
    setDuration(durationHint > 0 ? durationHint : 0)

    const isHls = fileUrl.includes('.m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 120,
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1, // Auto
      })
      hlsRef.current = hls
      hls.loadSource(fileUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (savedPosition > 0) video.currentTime = savedPosition
        const levels = data.levels
          .map((lvl: { height: number }, i: number) => ({ height: lvl.height, index: i }))
          .filter((l: { height: number }) => l.height > 0)
          .sort((a: { height: number }, b: { height: number }) => b.height - a.height)
        setQualityLevels(levels)
        setCurrentQuality(-1)
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        if (hls.autoLevelEnabled) setCurrentQuality(-1)
        else setCurrentQuality(data.level)
      })

      // MediaSource often reports Infinity/0 when metadata first loads. For a
      // VOD stream, the parsed HLS level has the reliable segment total.
      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        syncDuration(data.details.totalduration)
      })

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
        }
      })
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = fileUrl
      if (savedPosition > 0) video.currentTime = savedPosition
    } else {
      video.src = fileUrl
      if (savedPosition > 0) video.currentTime = savedPosition
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null } }
  }, [fileUrl, durationHint, syncDuration])

  // Restore position when prop changes (e.g. switching lesson)
  useEffect(() => {
    const v = videoRef.current
    if (savedPosition > 0 && v && v.readyState >= 1) v.currentTime = savedPosition
  }, [savedPosition])

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // PiP change listener
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const enterPip = () => setIsPip(true)
    const leavePip = () => setIsPip(false)
    video.addEventListener('enterpictureinpicture', enterPip)
    video.addEventListener('leavepictureinpicture', leavePip)
    return () => {
      video.removeEventListener('enterpictureinpicture', enterPip)
      video.removeEventListener('leavepictureinpicture', leavePip)
    }
  }, [])

  // ── Controls auto-hide ───────────────────────────────────────────────────
  const resetHide = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false)
    }, 3000)
  }, [])

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  // ── Helpers (stable callbacks) ───────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => null)
      setPulse({ type: 'play', id: Date.now() })
    } else {
      v.pause()
      setPulse({ type: 'pause', id: Date.now() })
    }
  }, [])

  const seekBy = useCallback((s: number) => {
    const v = videoRef.current
    if (!v) return
    const newTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s))
    v.currentTime = newTime
    setCurrent(newTime)
    setFlash({ dir: s > 0 ? 1 : -1, id: Date.now(), amount: Math.abs(s) })
  }, [])

  const seekToPercent = useCallback((pct: number) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    v.currentTime = (pct / 100) * v.duration
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const adjustVolume = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    const newVol = Math.max(0, Math.min(1, v.volume + delta))
    v.volume = newVol
    v.muted = newVol === 0
    setVolume(newVol)
    setMuted(newVol === 0)
    // Show volume OSD
    setVolumeOsd({ vol: newVol, id: Date.now() })
    clearTimeout(volumeOsdTimer.current)
    volumeOsdTimer.current = setTimeout(() => setVolumeOsd(null), 1500)
  }, [])

  const toggleCaptions = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const on = !captionsOnRef.current
    setCaptionsOn(on)
    Array.from(v.textTracks).forEach(t => { t.mode = on ? 'showing' : 'hidden' })
  }, [])

  const togglePip = useCallback(async () => {
    const v = videoRef.current
    if (!v) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else await v.requestPictureInPicture()
    } catch { /* PiP not supported */ }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => null)
    else document.exitFullscreen().catch(() => null)
  }, [])

  const closeSettings = useCallback(() => { setShowSettings(false); setSettingsView('main') }, [])

  const pickSpeed = useCallback((s: number) => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = s
    setSpeed(s)
  }, [])

  const pickQuality = useCallback((levelIndex: number) => {
    const hls = hlsRef.current
    const v = videoRef.current
    if (hls) {
      const wasPlaying = v && !v.paused
      if (levelIndex === -1) {
        // Auto: let ABR decide, switch smoothly on next segment
        hls.currentLevel = -1
      } else {
        // Specific level: use nextLevel for seamless switch (no buffer flush)
        hls.nextLevel = levelIndex
      }
      // If video was playing but gets paused by buffer flush, auto-resume
      if (wasPlaying && v) {
        const resumeIfPaused = () => {
          if (v.paused) v.play().catch(() => null)
        }
        // Check after a short delay to allow the level switch event to settle
        setTimeout(resumeIfPaused, 300)
        setTimeout(resumeIfPaused, 800)
        setTimeout(resumeIfPaused, 1500)
      }
    }
    setCurrentQuality(levelIndex)
    closeSettings()
  }, [closeSettings])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      // Only handle when player is focused or body is active element
      const focused = document.activeElement
      if (focused && focused !== document.body && !containerRef.current?.contains(focused)) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault(); togglePlay(); break
        case 'ArrowRight':
        case 'l':
          e.preventDefault(); seekBy(SEEK_STEP); break
        case 'ArrowLeft':
        case 'j':
          e.preventDefault(); seekBy(-SEEK_STEP); break
        case 'ArrowUp':
          e.preventDefault(); adjustVolume(0.1); break
        case 'ArrowDown':
          e.preventDefault(); adjustVolume(-0.1); break
        case 'f':
          e.preventDefault(); toggleFullscreen(); break
        case 'm':
          e.preventDefault(); toggleMute(); break
        case 'p':
          e.preventDefault(); togglePip(); break
        case 'c':
          e.preventDefault(); if (hasCaptionTracks) toggleCaptions(); break
        case 't':
          e.preventDefault(); onToggleTheater?.(); break
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault(); seekToPercent(parseInt(e.key) * 10); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, seekBy, adjustVolume, toggleMute, toggleFullscreen, togglePip, toggleCaptions, seekToPercent, hasCaptionTracks, onToggleTheater])

  // ── Seek bar interaction ─────────────────────────────────────────────────
  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
    setSeeking(false)
  }

  const handleVolumeBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const val = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.volume = val
    v.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
  }

  // ── Container click (single = play/pause, double = seek sides) ──────────
  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [role="slider"], .no-click')) return
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      const half = (containerRef.current?.getBoundingClientRect().width ?? 0) / 2
      seekBy(e.clientX < half ? -SEEK_STEP : SEEK_STEP)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        togglePlay()
      }, 220)
    }
  }

  const updateBuffered = () => {
    const v = videoRef.current
    if (!v || !v.buffered.length) return
    try { setBuffered(v.buffered.end(v.buffered.length - 1)) } catch { /* ignore */ }
  }

  const progressPct = duration ? (current / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0
  const hoverPct = hover && duration ? (hover.t / duration) * 100 : null
  const pipSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document

  const qualityLabel = (idx: number) => {
    if (idx === -1) return 'Auto'
    return `${qualityLevels.find(l => l.index === idx)?.height ?? ''}p`
  }

  // Volume icon based on level
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative group/player w-full overflow-hidden bg-black select-none outline-none ${fill ? 'h-full' : 'aspect-video'}`}
      onMouseMove={resetHide}
      onMouseEnter={resetHide}
      onMouseLeave={() => { if (playing) setShowControls(false) }}
      onClick={handleContainerClick}
      onContextMenu={e => e.preventDefault()}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        poster={poster}
        onPlay={() => { setPlaying(true); setStarted(true); resetHide() }}
        onPause={() => { setPlaying(false); setShowControls(true); clearTimeout(hideTimer.current) }}
        onEnded={() => { setPlaying(false); setShowControls(true); onEndedRef.current() }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => { setBuffering(false); setSeeking(false) }}
        onCanPlayThrough={() => setBuffering(false)}
        onSeeking={() => { setSeeking(true); updateBuffered() }}
        onSeeked={() => { setSeeking(false); updateBuffered() }}
        onLoadedMetadata={() => {
          const v = videoRef.current!
          syncDuration(v.duration)
          setHasCaptionTracks(v.textTracks.length > 0)
          if (savedPosition > 0) v.currentTime = savedPosition
        }}
        onDurationChange={() => syncDuration()}
        onTimeUpdate={() => {
          const v = videoRef.current!
          setCurrent(v.currentTime)
          updateBuffered()
          if (v.currentTime - lastSave.current >= 5) {
            lastSave.current = v.currentTime
            onProgressRef.current(Math.floor(v.currentTime), false)
          }
        }}
        onVolumeChange={() => {
          const v = videoRef.current!
          setMuted(v.muted)
          setVolume(v.muted ? 0 : v.volume)
        }}
        onProgress={updateBuffered}
      />

      {/* THUMBNAIL / BIG PLAY OVERLAY – shown before first play */}
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-2 ring-white/30"
            >
              <Play size={36} className="text-white ml-1.5" fill="white" />
            </motion.div>
            {savedPosition > 0 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                Resume from {formatTime(savedPosition)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUFFERING / SEEKING SPINNER */}
      <AnimatePresence>
        {(buffering || seeking) && started && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEEK FLASH – left half (backward) */}
      <AnimatePresence>
        {flash && flash.dir === -1 && (
          <motion.div
            key={`fl-${flash.id}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-5 py-3">
              <RotateCcw size={22} className="text-white" />
              <span className="text-white text-xs font-bold">{flash.amount}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEEK FLASH – right half (forward) */}
      <AnimatePresence>
        {flash && flash.dir === 1 && (
          <motion.div
            key={`fr-${flash.id}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-5 py-3">
              <RotateCw size={22} className="text-white" />
              <span className="text-white text-xs font-bold">{flash.amount}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAY/PAUSE PULSE */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            key={pulse.id}
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {pulse.type === 'play'
                ? <Play size={28} fill="white" className="text-white ml-1" />
                : <Pause size={28} fill="white" className="text-white" />
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VOLUME OSD – shown when volume is changed via keyboard */}
      <AnimatePresence>
        {volumeOsd && (
          <motion.div
            key={volumeOsd.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-50"
          >
            <div className="flex flex-col items-center gap-2 bg-black/75 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl min-w-[130px]">
              <div className="flex items-center gap-2 text-white">
                {volumeOsd.vol === 0
                  ? <VolumeX size={18} />
                  : volumeOsd.vol < 0.5
                    ? <Volume1 size={18} />
                    : <Volume2 size={18} />
                }
                <span className="text-sm font-semibold tabular-nums w-9 text-right">
                  {Math.round(volumeOsd.vol * 100)}%
                </span>
              </div>
              {/* Volume bar */}
              <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: `${volumeOsd.vol * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTROLS OVERLAY ──────────────────────────────────────────────── */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-3 px-3"
        onClick={e => e.stopPropagation()}
      >
        {/* PROGRESS BAR */}
        <div
          className="relative mb-3 cursor-pointer group/bar"
          style={{ height: '18px', display: 'flex', alignItems: 'center' }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const t = ((e.clientX - rect.left) / rect.width) * (duration || 0)
            setHover({ x: e.clientX - rect.left, t })
          }}
          onMouseLeave={() => setHover(null)}
          onClick={handleSeekBar}
        >
          {/* Hover tooltip */}
          {hover && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10"
              style={{ left: hover.x }}
            >
              {formatTime(hover.t)}
            </div>
          )}
          {/* Track background */}
          <div className="absolute inset-x-0 h-1 rounded-full bg-white/20 group-hover/bar:h-1.5 transition-all" />
          {/* Buffered */}
          <div
            className="absolute left-0 h-1 rounded-full bg-white/35 group-hover/bar:h-1.5 transition-all"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* Played */}
          <div
            className="absolute left-0 h-1 rounded-full bg-primary group-hover/bar:h-1.5 transition-all"
            style={{ width: `${progressPct}%` }}
          />
          {/* Scrubber dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity z-10"
            style={{ left: `calc(${hoverPct ?? progressPct}% - 7px)` }}
          />
        </div>

        {/* BOTTOM CONTROLS ROW */}
        <div className="flex items-center justify-between gap-2">

          {/* ── LEFT SIDE ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 sm:gap-2 text-white min-w-0">

            {/* Play/Pause */}
            <button onClick={togglePlay} className="p-1.5 hover:text-primary transition-colors shrink-0" aria-label="Play/Pause (K)">
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            {/* Seek back 10s */}
            <button
              onClick={() => seekBy(-SEEK_STEP)}
              className="relative p-1.5 hover:text-primary transition-colors shrink-0"
              aria-label="Rewind 10s (←)"
            >
              <SkipBack size={20} />
            </button>

            {/* Seek forward 10s */}
            <button
              onClick={() => seekBy(SEEK_STEP)}
              className="relative p-1.5 hover:text-primary transition-colors shrink-0"
              aria-label="Forward 10s (→)"
            >
              <SkipForward size={20} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/vol shrink-0">
              <button onClick={toggleMute} className="p-1.5 hover:text-primary transition-colors" aria-label="Toggle mute (M)">
                <VolumeIcon size={20} />
              </button>
              <div
                className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200 cursor-pointer hidden sm:block"
                onClick={handleVolumeBar}
              >
                <div className="relative h-1.5 mx-1 rounded-full bg-white/20">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width]" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Time */}
            <span className="text-xs tabular-nums text-white/80 whitespace-nowrap hidden sm:inline">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>

          {/* ── RIGHT SIDE ────────────────────────────────────────────── */}
          <div className="flex items-center gap-0.5 text-white shrink-0">

            {/* Speed chip */}
            <span className="text-[12px] font-semibold text-white/60 tabular-nums px-1 hidden sm:inline">{speed}x</span>

            {/* Captions (only when tracks available) */}
            {hasCaptionTracks && (
              <button
                onClick={toggleCaptions}
                className={`p-1.5 transition-colors ${captionsOn ? 'text-primary' : 'hover:text-primary text-white/70'}`}
                aria-label="Captions (C)"
              >
                <Captions size={18} />
              </button>
            )}

            {/* Picture-in-Picture */}
            {pipSupported && (
              <button
                onClick={togglePip}
                className={`p-1.5 transition-colors ${isPip ? 'text-primary' : 'hover:text-primary text-white/70'}`}
                aria-label="Picture in Picture (P)"
              >
                <PictureInPicture2 size={18} />
              </button>
            )}

            {/* Settings */}
            <div className="relative no-click">
              <button
                onClick={e => { e.stopPropagation(); setShowSettings(s => !s); setSettingsView('main') }}
                className={`p-1.5 transition-colors ${showSettings ? 'text-primary' : 'hover:text-primary text-white/70'}`}
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-10 right-0 bg-black/95 backdrop-blur-md rounded-xl p-1.5 w-48 shadow-2xl border border-white/10 text-xs text-white/90 z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    {settingsView === 'main' && (
                      <>
                        <p className="text-[10px] uppercase tracking-widest text-white/30 px-2 py-1 mb-0.5">Settings</p>
                        <button
                          onClick={() => setSettingsView('speed')}
                          className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <span>Playback speed</span>
                          <span className="text-white/40 text-[11px]">{speed === 1 ? 'Normal' : `${speed}x`}</span>
                        </button>
                        {qualityLevels.length > 0 && (
                          <button
                            onClick={() => setSettingsView('quality')}
                            className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <span>Quality</span>
                            <span className="text-white/40 text-[11px]">{qualityLabel(currentQuality)}</span>
                          </button>
                        )}
                      </>
                    )}
                    {settingsView === 'speed' && (
                      <>
                        <button
                          onClick={() => setSettingsView('main')}
                          className="flex items-center gap-1.5 text-white/40 px-2 py-1.5 hover:text-white/80 transition-colors text-[11px] mb-1"
                        >
                          <ChevronLeft size={13} /> Playback speed
                        </button>
                        {SPEEDS.map(s => (
                          <button
                            key={s}
                            onClick={() => { pickSpeed(s); closeSettings() }}
                            className={`flex items-center justify-between w-full px-2 py-2 rounded-lg transition-colors ${s === speed ? 'text-primary bg-primary/10' : 'hover:bg-white/10'}`}
                          >
                            {s === 1 ? 'Normal' : `${s}x`}
                            {s === speed && <Check size={13} />}
                          </button>
                        ))}
                      </>
                    )}
                    {settingsView === 'quality' && (
                      <>
                        <button
                          onClick={() => setSettingsView('main')}
                          className="flex items-center gap-1.5 text-white/40 px-2 py-1.5 hover:text-white/80 transition-colors text-[11px] mb-1"
                        >
                          <ChevronLeft size={13} /> Quality
                        </button>
                        <button
                          onClick={() => pickQuality(-1)}
                          className={`flex items-center justify-between w-full px-2 py-2 rounded-lg transition-colors ${currentQuality === -1 ? 'text-primary bg-primary/10' : 'hover:bg-white/10'}`}
                        >
                          <span>Auto</span>
                          {currentQuality === -1 && <Check size={13} />}
                        </button>
                        {qualityLevels.map(lvl => (
                          <button
                            key={lvl.index}
                            onClick={() => pickQuality(lvl.index)}
                            className={`flex items-center justify-between w-full px-2 py-2 rounded-lg transition-colors ${currentQuality === lvl.index ? 'text-primary bg-primary/10' : 'hover:bg-white/10'}`}
                          >
                            <span>{lvl.height}p</span>
                            {currentQuality === lvl.index && <Check size={13} />}
                          </button>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theater mode */}
            {onToggleTheater && (
              <button
                onClick={onToggleTheater}
                className={`p-1.5 transition-colors ${theater ? 'text-primary' : 'hover:text-primary text-white/70'}`}
                aria-label="Theater mode (T)"
              >
                <Tv2 size={18} />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={e => { e.stopPropagation(); toggleFullscreen() }}
              className="p-1.5 hover:text-primary transition-colors text-white/70"
              aria-label="Fullscreen (F)"
            >
              {isFs ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          </div>
        </div>

        {/* Keyboard shortcut hint – shown on first hover */}
        <div className="absolute top-2 right-3 text-[10px] text-white/20 hidden group-hover/player:block pointer-events-none select-none">
          Space · ←→ Seek · ↑↓ Vol · F Full · P PiP · M Mute
        </div>
      </motion.div>
    </div>
  )
})

function formatTime(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ── YouTube Player ────────────────────────────────────────────────────────────

const YouTubePlayer = forwardRef<VideoPlayerHandle, Required<Pick<VideoPlayerProps, 'youtubeUrl' | 'onProgress' | 'onEnded'>> & { savedPosition: number; fill?: boolean }>(function YouTubePlayer(
  { youtubeUrl, savedPosition, onProgress, fill },
  ref
) {
  const progressRef = useRef(savedPosition)
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress
  const [startAt, setStartAt] = useState(Math.floor(savedPosition))

  const videoId = youtubeUrl.includes('embed/')
    ? youtubeUrl.split('embed/')[1]?.split('?')[0]
    : youtubeUrl.split('v=')[1]?.split('&')[0]

  const startUrl = startAt > 0
    ? `https://www.youtube.com/embed/${videoId}?start=${startAt}&rel=0&autoplay=1&modestbranding=1`
    : `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`

  useImperativeHandle(ref, () => ({
    seek: (seconds: number) => { progressRef.current = seconds; setStartAt(Math.floor(seconds)) },
    getCurrentTime: () => progressRef.current,
  }))

  useEffect(() => {
    const interval = setInterval(() => {
      progressRef.current += 5
      onProgressRef.current(progressRef.current, false)
    }, 5000)
    return () => { clearInterval(interval); onProgressRef.current(progressRef.current, false) }
  }, [])

  if (!videoId) {
    return <div className="aspect-video grid place-items-center rounded-card bg-surface2 text-muted">Invalid YouTube URL</div>
  }

  return (
    <div className={`relative w-full overflow-hidden bg-black ${fill ? 'h-full' : 'aspect-video'}`}>
      <iframe
        src={startUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Lesson video"
      />
    </div>
  )
})
