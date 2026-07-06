import { Router } from 'express'
import * as ctrl from './video.controller'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { uploadVideo, uploadImage, uploadResource } from '../../config/upload'

const router = Router()

router.get('/stream/*path', ctrl.playlist)
router.post('/upload', authenticate, requireRole('admin'), uploadVideo.single('video'), ctrl.upload)
router.post('/image', authenticate, requireRole('admin'), uploadImage.single('image'), ctrl.uploadImage)
router.post('/resource', authenticate, requireRole('admin'), uploadResource.single('file'), ctrl.uploadResource)
router.get('/job/:jobId', authenticate, requireRole('admin'), ctrl.jobStatus)
router.get('/progress/:lessonId', authenticate, requireRole('admin'), ctrl.lessonProgress)
router.get('/:lessonId/play', authenticate, ctrl.playVideo)

export default router

