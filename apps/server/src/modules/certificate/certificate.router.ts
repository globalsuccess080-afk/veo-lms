import { Router } from 'express'
import * as ctrl from './certificate.controller'

const router = Router()

router.get('/admin', ...ctrl.getAdminCertificates)
router.post('/generate/:courseId', ...ctrl.generateCertificate)
router.get('/course/:courseId', ...ctrl.getCourseCertificate)
router.get('/public/:certificateId', ...ctrl.getPublicCertificate)
router.post('/:certificateId/download-request', ctrl.requestPdfGeneration)
router.post('/:certificateId/revoke', ...ctrl.revokeCertificate)

export default router
