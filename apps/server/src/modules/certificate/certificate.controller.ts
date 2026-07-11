import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { Certificate } from './certificate.model'
import { certificateQueue } from './certificate.queue'
import { Course } from '../course/course.model'
import { Progress } from '../progress/progress.model'
import { Lesson } from '../lesson/lesson.model'
import { ApiError } from '../../utils/apiError'
import { env } from '../../config/env'
import { generatePDF } from './certificate.generator'
import { logger } from '../../utils/logger'
import { formatAssetPath } from '../../utils/assetPath'

function generateCertificateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function createUniqueCertificateId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const certificateId = generateCertificateId()
    const existing = await Certificate.exists({ certificateId })
    if (!existing) return certificateId
  }
  throw new ApiError(500, 'Could not generate a unique certificate ID. Please try again.')
}

export const generateCertificate = [
  authenticate,
  asyncHandler(async (req, res) => {
    const courseId = req.params.courseId
    const userId = req.user!.id

    const course = await Course.findById(courseId)
    if (!course) throw new ApiError(404, 'Course not found')

    const totalLessons = await Lesson.countDocuments({ courseId })
    const completedLessons = await Progress.countDocuments({ userId, courseId, isCompleted: true })
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    if (progressPct < 85) {
      throw new ApiError(400, `Insufficient progress (${progressPct}%). Must be at least 85%.`)
    }

    const existing = await Certificate.findOne({ userId, courseId })
    if (existing) {
      return sendSuccess(res, existing, 'Certificate already exists')
    }

    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateId: await createUniqueCertificateId(),
      progressPercentage: progressPct,
      issuedAt: new Date(),
      status: 'active',
    })

    certificateQueue.add('generate', { userId, courseId }).catch(() => undefined)

    sendSuccess(res, certificate, 'Certificate generated successfully', 201)
  }),
]

export const getCourseCertificate = [
  authenticate,
  asyncHandler(async (req, res) => {
    const cert = await Certificate.findOne({
      userId: req.user!.id,
      courseId: req.params.courseId,
    })

    if (!cert) {
      return res.status(202).json({
        success: false,
        message: 'Certificate is not ready yet. Please try again in a moment.',
        data: null,
      })
    }

    sendSuccess(res, cert)
  }),
]

export const requestPdfGeneration = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).populate('userId courseId')
  if (!cert) throw new ApiError(404, 'Certificate not found')
  
  const user = cert.userId as any
  const course = cert.courseId as any
  
  const publicUrl = `${env.FRONTEND_URL}/certificate/${cert.certificateId}`
  const dateStr = new Date(cert.issuedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  
  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generatePDF({
      studentName: typeof user.getDecryptedName === 'function' ? user.getDecryptedName() : user.name,
      courseName: course.title,
      date: dateStr,
      certId: cert.certificateId,
      publicUrl
    })
  } catch (err) {
    logger.error('Certificate PDF generation failed', {
      certificateId: cert.certificateId,
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw new ApiError(500, 'We could not create the PDF right now. Please try again in a moment.')
  }
  
  const base64Data = Buffer.from(pdfBytes).toString('base64')

  sendSuccess(res, { data: base64Data })
})

export const getPublicCertificate = [
  asyncHandler(async (req, res) => {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('userId', 'name')
      .populate('courseId', 'title')
      .lean()

    if (!cert) throw new ApiError(404, 'Certificate not found')

    sendSuccess(res, {
      certificateId: cert.certificateId,
      studentName: (cert.userId as any).name,
      courseName: (cert.courseId as any).title,
      issuedAt: cert.issuedAt,
      status: cert.status,
    })
  }),
]

export const getMyCertificates = [
  authenticate,
  asyncHandler(async (req, res) => {
    const certs = await Certificate.find({ userId: req.user!.id })
      .populate('courseId', 'title slug thumbnail instructor totalLessons')
      .sort({ issuedAt: -1, createdAt: -1 })
      .lean()

    sendSuccess(res, certs.map((cert) => {
      const course = cert.courseId as any
      return {
        ...cert,
        courseId: course && typeof course === 'object'
          ? {
              ...course,
              thumbnail: course.thumbnail ? formatAssetPath(course.thumbnail) : course.thumbnail,
            }
          : course,
      }
    }))
  }),
]

export const getAdminCertificates = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const certs = await Certificate.find()
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .lean()
    sendSuccess(res, certs)
  }),
]

export const revokeCertificate = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const cert = await Certificate.findOneAndUpdate(
      { certificateId: req.params.certificateId },
      { status: 'revoked' },
      { new: true }
    )
    if (!cert) throw new ApiError(404, 'Certificate not found')
    sendSuccess(res, cert, 'Certificate revoked successfully')
  }),
]
