import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Volume2, VolumeX, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { parseYouTubeId, cn } from '../../lib/utils'
import { resolveAssetUrl } from '../../lib/assets'

const SPEEDS = [1, 1.5, 2] as const

type YTPlayer = {
  mute: () => void
  unMute: () => void
  setPlaybackRate: (rate: number) => void
  destroy: () => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiLoading = false
let apiReady = false
const apiWaiters: (() => void)[] = []

function loadYouTubeAPI() {
  if (apiReady) return Promise.resolve()
  return new Promise<void>((resolve) => {
    if (window.YT?.Player) { apiReady = true; resolve(); return }
    apiWaiters.push(resolve)
    if (apiLoading) return
    apiLoading = true
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true; apiLoading = false; prev?.()
      apiWaiters.splice(0).forEach((fn) => fn())
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

function resolvePoster(thumbnail: string, videoId: string | null) {
  const isEmbed = thumbnail.includes('youtube.com/embed') || thumbnail.includes('youtu.be')
  if (thumbnail && !isEmbed) return resolveAssetUrl(thumbnail)
  if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  return resolveAssetUrl(thumbnail)
}

interface TrailerPlayerProps {
  trailerUrl?: string
  thumbnail: string
  title: string
}

function VideoModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [ready, setReady] = useState(false)
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  const destroyPlayer = useCallback(() => {
    try { playerRef.current?.destroy() } catch { }
    playerRef.current = null
    setReady(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadYouTubeAPI().then(() => {
      if (cancelled || !mountRef.current) return
      destroyPlayer()
      mountRef.current.innerHTML = ''
      playerRef.current = new window.YT!.Player(mountRef.current, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          mute: 0,
          cc_load_policy: 0,
          origin: window.location.origin,
          enablejsapi: 1
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (cancelled) return
            e.target.setPlaybackRate(speed)
            setReady(true)
          }
        }
      })
    })
    return () => { cancelled = true; destroyPlayer() }
  }, [videoId, destroyPlayer])

  useEffect(() => {
    const p = playerRef.current
    if (!p || !ready) return
    try { muted ? p.mute() : p.unMute(); p.setPlaybackRate(speed) } catch { }
  }, [muted, speed, ready])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center"
        style={{
          top: 'var(--navbar-height, 64px)',
          padding: 'clamp(12px, 4vw, 48px)'
        }}
        onClick={onClose}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(24px)' }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 70%)`
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
          className="relative w-full max-w-[1000px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute -inset-[1px] rounded-2xl pointer-events-none"
            style={{
              background: `linear-gradient(145deg, color-mix(in srgb, var(--primary) 55%, transparent) 0%, transparent 40%, color-mix(in srgb, var(--primary) 25%, transparent) 100%)`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute -inset-[4px] rounded-3xl pointer-events-none"
            style={{
              background: `linear-gradient(145deg, color-mix(in srgb, var(--primary) 25%, transparent) 0%, transparent 50%)`,
              filter: 'blur(10px)',
              opacity: 0.5
            }}
          />

          <div
            className="relative rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: `linear-gradient(160deg, color-mix(in srgb, var(--primary) 15%, #0a0a0f) 0%, #0a0a0f 38%, color-mix(in srgb, var(--primary) 8%, #0a0a0f) 100%)`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.85), 0 0 80px color-mix(in srgb, var(--primary) 15%, transparent)`
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5 shrink-0"
              style={{
                background: 'rgba(255,255,255,0.025)',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: 'var(--primary)' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ background: 'var(--primary)' }}
                  />
                </span>
                <span className="text-[13px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {title}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)'
                }}
                onMouseEnter={e => {
                  const t = e.currentTarget
                  t.style.background = 'color-mix(in srgb, var(--primary) 18%, rgba(255,255,255,0.05))'
                  t.style.color = 'rgba(255,255,255,0.9)'
                  t.style.borderColor = 'color-mix(in srgb, var(--primary) 35%, rgba(255,255,255,0.1))'
                }}
                onMouseLeave={e => {
                  const t = e.currentTarget
                  t.style.background = 'rgba(255,255,255,0.04)'
                  t.style.color = 'rgba(255,255,255,0.45)'
                  t.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <div className="absolute inset-0 overflow-hidden bg-black">
                <div
                  ref={mountRef}
                  className="absolute [&_iframe]:pointer-events-none"
                  style={{ top: '-10%', left: '-10%', width: '120%', height: '120%' }}
                />
                <div className="absolute top-0 inset-x-0 h-14 bg-black pointer-events-none z-10" />
                <div className="absolute bottom-0 inset-x-0 h-14 bg-black pointer-events-none z-10" />
                <div className="absolute left-0 inset-y-0 w-8 bg-black pointer-events-none z-10" />
                <div className="absolute right-0 inset-y-0 w-8 bg-black pointer-events-none z-10" />
                <div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.55) 100%)`
                  }}
                />
              </div>

              {!ready && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black">
                  <div className="relative w-11 h-11 mb-4">
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        background: `conic-gradient(var(--primary) 0deg, transparent 270deg)`,
                        mask: 'radial-gradient(farthest-side, transparent 68%, #000 70%)',
                        WebkitMask: 'radial-gradient(farthest-side, transparent 68%, #000 70%)'
                      }}
                    />
                    <div
                      className="absolute inset-2 rounded-full"
                      style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                    />
                  </div>
                  <span
                    className="text-[11px] tracking-[0.16em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                  >
                    Loading preview
                  </span>
                </div>
              )}

              <AnimatePresence>
                {ready && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.28 }}
                    className="absolute inset-x-0 bottom-0 z-30 p-4 pointer-events-auto"
                  >
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl px-4 py-2.5"
                      style={{
                        background: `linear-gradient(135deg, rgba(8,8,12,0.94) 0%, color-mix(in srgb, var(--primary) 18%, rgba(8,8,12,0.9)) 100%)`,
                        border: '1px solid rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(28px)',
                        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset`
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setMuted((m) => !m)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all"
                        style={{
                          background: muted
                            ? 'rgba(255,255,255,0.06)'
                            : `color-mix(in srgb, var(--primary) 24%, rgba(0,0,0,0.5))`,
                          border: muted
                            ? '1px solid rgba(255,255,255,0.08)'
                            : `1px solid color-mix(in srgb, var(--primary) 35%, transparent)`
                        }}
                      >
                        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        {muted ? 'Unmute' : 'Mute'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] uppercase tracking-[0.15em] font-bold mr-1"
                          style={{ color: 'rgba(255,255,255,0.28)' }}
                        >
                          Speed
                        </span>
                        {SPEEDS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSpeed(s)}
                            className="min-w-[2.4rem] px-2.5 py-2 rounded-lg text-[12px] font-bold tabular-nums transition-all"
                            style={
                              speed === s
                                ? {
                                    background: 'var(--primary)',
                                    color: 'var(--primary-fg)',
                                    transform: 'scale(1.06)',
                                    boxShadow: `0 3px 12px color-mix(in srgb, var(--primary) 45%, transparent)`
                                  }
                                : {
                                    background: 'rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.55)',
                                    border: '1px solid rgba(255,255,255,0.07)'
                                  }
                            }
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
  )
}

export function TrailerPlayer({ trailerUrl, thumbnail, title }: TrailerPlayerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const videoId = trailerUrl ? parseYouTubeId(trailerUrl) : null
  const poster = useMemo(() => resolvePoster(thumbnail, videoId), [thumbnail, videoId])

  const PosterView = () => (
    <div className="group relative aspect-video w-full overflow-hidden select-none bg-surface">
      <img
        src={poster}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        draggable={false}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25" />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 62%)' }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--fg-inverse) 8%, transparent)' }}
      />

      <div className="absolute inset-0 grid place-items-center">
        <div className="relative flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full scale-[1.6] opacity-0 group-hover:opacity-45 transition-all duration-500"
              style={{ background: 'var(--primary)', filter: 'blur(16px)' }}
            />
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="relative w-16 h-16 rounded-full grid place-items-center"
              style={{
                background: 'linear-gradient(145deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #000))',
                boxShadow: `
                  0 0 0 3px color-mix(in srgb, var(--fg-inverse) 10%, transparent),
                  0 12px 36px rgba(0,0,0,0.5),
                  0 4px 20px color-mix(in srgb, var(--primary) 50%, transparent)
                `
              }}
            >
              <Play size={24} className="ml-0.5 text-primary-fg" fill="currentColor" />
            </motion.div>
          </div>
          <span
            className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/90 px-3.5 py-1.5 rounded-full"
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid color-mix(in srgb, var(--fg-inverse) 12%, transparent)'
            }}
          >
            Watch preview
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {videoId ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="block w-full text-left focus:outline-none"
          aria-label={`Watch preview for ${title}`}
        >
          <PosterView />
        </button>
      ) : (
        <PosterView />
      )}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalOpen && videoId && (
            <VideoModal videoId={videoId} title={title} onClose={() => setModalOpen(false)} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}