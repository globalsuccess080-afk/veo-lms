import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export interface VideoProgressState {
  percent: number
  stage: string
  status: 'queued' | 'processing' | 'ready' | 'failed'
  completedQualities: string[]
  elapsedMs: number
  etaSeconds: number | null
  currentQuality?: string
  connected: boolean
}

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '')

// Singleton socket so multiple components share one connection
let _socket: Socket | null = null

function getSocket(token: string): Socket {
  if (_socket) return _socket
  _socket = io(SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  })
  return _socket
}

export function useVideoProgress(lessonId: string | null, expectedJobId?: string) {
  const token = useAuthStore(s => s.accessToken)
  const [state, setState] = useState<VideoProgressState>({
    percent: 0,
    stage: 'Queued…',
    status: 'queued',
    completedQualities: [],
    elapsedMs: 0,
    etaSeconds: null,
    connected: false,
  })
  const socketRef = useRef<Socket | null>(null)
  const activeJobId = useRef(expectedJobId)
  const pollTimer = useRef<ReturnType<typeof setTimeout>>()

  // REST fallback: fetch current progress from DB (used on mount/reconnect)
  const fetchFallback = useCallback(async () => {
    if (!lessonId) return
    try {
      const { data } = await api.get(`/videos/progress/${lessonId}`)
      const d = data.data
      activeJobId.current = d.jobId || activeJobId.current
      if (d.status === 'ready') {
        setState(prev => ({ ...prev, percent: 100, stage: 'Complete!', status: 'ready' }))
      } else if (d.status === 'failed') {
        setState(prev => ({ ...prev, stage: 'Failed', status: 'failed' }))
      } else {
        const status = d.status === 'queued' ? 'queued' : 'processing'
        setState(prev => ({
          ...prev,
          percent: d.progress || prev.percent,
          status,
          stage: d.message || d.stage || prev.stage,
          etaSeconds: d.etaSeconds ?? null,
          currentQuality: d.currentQuality || undefined,
          completedQualities: d.completedQualities || prev.completedQualities,
        }))
      }
    } catch {
      // ignore, socket will deliver updates when ready
    }
  }, [lessonId])

  useEffect(() => {
    if (!lessonId || !token) return

    // Fetch REST snapshot immediately on mount (handles page refresh)
    fetchFallback()

    const socket = getSocket(token)
    socketRef.current = socket

    setState(prev => ({ ...prev, connected: socket.connected }))

    const onConnect = () => {
      clearInterval(pollTimer.current)
      setState(prev => ({ ...prev, connected: true }))
      // Re-fetch snapshot in case we missed events while disconnected
      fetchFallback()
    }

    const onDisconnect = () => {
      setState(prev => ({ ...prev, connected: false }))
      clearInterval(pollTimer.current)
      pollTimer.current = setInterval(fetchFallback, 15000)
    }

    const onProgress = (event: {
      lessonId: string
      jobId: string
      percent: number
      stage: string
      completedQualities: string[]
      elapsedMs: number
      message?: string
      etaSeconds?: number | null
      currentQuality?: string
    }) => {
      if (event.lessonId !== lessonId) return
      if (activeJobId.current && event.jobId !== activeJobId.current) return
      setState(prev => ({
        ...prev,
        percent: event.percent,
        stage: event.message || event.stage,
        status: event.percent >= 100 ? 'ready' : 'processing',
        completedQualities: event.completedQualities,
        elapsedMs: event.elapsedMs,
        etaSeconds: event.etaSeconds ?? null,
        currentQuality: event.currentQuality,
        connected: true,
      }))
    }

    const onComplete = (event: { lessonId: string }) => {
      if (event.lessonId !== lessonId) return
      setState(prev => ({
        ...prev,
        percent: 100,
        stage: 'Complete!',
        status: 'ready',
        connected: true,
      }))
    }

    const onFailed = (event: { lessonId: string; error: string }) => {
      if (event.lessonId !== lessonId) return
      setState(prev => ({
        ...prev,
        stage: `Failed: ${event.error}`,
        status: 'failed',
        connected: true,
      }))
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onDisconnect)
    socket.on('video:progress', onProgress)
    socket.on('video:complete', onComplete)
    socket.on('video:failed', onFailed)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onDisconnect)
      socket.off('video:progress', onProgress)
      socket.off('video:complete', onComplete)
      socket.off('video:failed', onFailed)
      clearInterval(pollTimer.current)
    }
  }, [lessonId, token, fetchFallback, expectedJobId])

  return state
}
