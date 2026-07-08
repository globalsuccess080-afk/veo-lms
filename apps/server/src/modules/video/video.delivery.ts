import path from 'path'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { env } from '../../config/env'
import { cache } from '../../utils/cache'
import { ApiError } from '../../utils/apiError'
import { storageService } from '../../storage/StorageService'

interface VideoTokenData {
  userId: string
  lessonId: string
  courseId: string
  storagePath: string
  version: string
}

interface VideoTokenPayload extends JwtPayload, VideoTokenData {
  type: 'video'
}

export function createVideoToken(data: VideoTokenData): string {
  return jwt.sign({ ...data, type: 'video' }, env.VIDEO_TOKEN_SECRET, {
    expiresIn: env.VIDEO_TOKEN_EXPIRY_SECONDS,
    audience: 'veolms-video',
    issuer: 'veolms-api',
  })
}

function verifyVideoToken(token: string): VideoTokenPayload {
  try {
    const payload = jwt.verify(token, env.VIDEO_TOKEN_SECRET, {
      audience: 'veolms-video',
      issuer: 'veolms-api',
    }) as VideoTokenPayload
    if (payload.type !== 'video') throw new Error('Invalid token type')
    return payload
  } catch {
    throw new ApiError(403, 'Video access token is invalid or expired')
  }
}

function normalizeStorageKey(value: string): string {
  const normalized = path.posix.normalize(value.replace(/\\/g, '/')).replace(/^\/+/, '')
  if (!normalized || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new ApiError(400, 'Invalid playlist path')
  }
  return normalized
}

async function readPlaylist(key: string): Promise<string> {
  const cacheKey = `video:playlist:${key}`
  try {
    return await cache.getOrSet(cacheKey, () => storageService.readText(key), 1200)
  } catch {
    return storageService.readText(key)
  }
}

function resolveEntry(playlistKey: string, entry: string): string {
  return normalizeStorageKey(path.posix.join(path.posix.dirname(playlistKey), entry.split('?')[0]))
}

export async function buildAuthorizedPlaylist(requestedPath: string, token: string): Promise<string> {
  const payload = verifyVideoToken(token)
  const playlistKey = normalizeStorageKey(requestedPath)
  const allowedPrefix = `${normalizeStorageKey(payload.storagePath)}/`
  if (!playlistKey.startsWith(allowedPrefix) || !playlistKey.endsWith('.m3u8')) {
    throw new ApiError(403, 'Playlist is outside the authorized video')
  }

  const source = await readPlaylist(playlistKey)
  const isMaster = playlistKey.endsWith('/master.m3u8')
  const lines = await Promise.all(source.split(/\r?\n/).map(async line => {
    const entry = line.trim()
    if (!entry || entry.startsWith('#')) return line
    const key = resolveEntry(playlistKey, entry)
    if (isMaster) {
      if (!key.endsWith('.m3u8')) throw new ApiError(500, 'Master playlist contains an invalid entry')
      const relative = path.posix.relative(path.posix.dirname(playlistKey), key)
      return `${relative}?token=${encodeURIComponent(token)}`
    }
    return storageService.getSignedUrl(key, env.VIDEO_SEGMENT_URL_EXPIRY_SECONDS)
  }))
  return lines.join('\n')
}
