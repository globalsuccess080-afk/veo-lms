import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { ApiError } from '../utils/apiError'

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads/temp')
export const VIDEO_DIR = path.join(UPLOAD_ROOT, 'videos')
export const IMAGE_DIR = path.join(UPLOAD_ROOT, 'images')
export const RESOURCE_DIR = path.join(UPLOAD_ROOT, 'resources')
export const HLS_DIR = path.join(UPLOAD_ROOT, 'hls')

fs.mkdirSync(VIDEO_DIR, { recursive: true })
fs.mkdirSync(IMAGE_DIR, { recursive: true })
fs.mkdirSync(RESOURCE_DIR, { recursive: true })
fs.mkdirSync(HLS_DIR, { recursive: true })

function diskStorage(dir: string, fallbackExt: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || fallbackExt
      cb(null, `${crypto.randomUUID()}${ext}`)
    }
  })
}

const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const ALLOWED_RESOURCE = [
  'application/pdf', 
  'application/zip', 
  'application/x-zip-compressed', 
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
  'text/markdown',
  'text/plain',
  'text/csv'
]

const ALLOWED_RESOURCE_EXT = [
  '.pdf',
  '.zip',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.svg',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.json',
  '.md',
  '.txt',
  '.csv'
]

export const uploadVideo = multer({
  storage: diskStorage(VIDEO_DIR, '.mp4'),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_VIDEO.includes(file.mimetype)) cb(null, true)
    else cb(new ApiError(400, 'Only video files are allowed (mp4, webm, mov, mkv)'))
  }
})

export const uploadImage = multer({
  storage: diskStorage(IMAGE_DIR, '.jpg'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE.includes(file.mimetype)) cb(null, true)
    else cb(new ApiError(400, 'Only image files are allowed (jpg, png, webp, gif, avif)'))
  }
})

export const uploadResource = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedMime = ALLOWED_RESOURCE.includes(file.mimetype)
    const allowedExt = ALLOWED_RESOURCE_EXT.includes(ext)
    if (allowedMime || allowedExt) cb(null, true)
    else cb(new ApiError(400, 'Invalid resource file type'))
  }
})
