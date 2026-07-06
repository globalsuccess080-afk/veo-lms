import { Router } from 'express'
import * as ctrl from './admin.controller'
import * as couponCtrl from '../coupon/coupon.controller'
import announcementRouter from '../announcement/announcement.router'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import multer from 'multer'

const upload = multer({ dest: 'uploads/temp/' })

const router = Router()
const adminAuth = [authenticate, requireRole('admin')]

router.get('/stats', ...ctrl.stats)
router.get('/students', ...ctrl.students)
router.patch('/students/:id', ...ctrl.toggleStudent)
router.get('/enrollments', ...ctrl.enrollments)
router.get('/export/courses', ...ctrl.exportCourses)
router.get('/export/students', ...ctrl.exportStudents)
router.get('/export/enrollments', ...ctrl.exportEnrollments)
router.post('/import/courses', adminAuth, upload.single('file'), ctrl.importCourses)
router.post('/import/students', adminAuth, upload.single('file'), ctrl.importStudents)
router.get('/jobs/:id', ...ctrl.getJobStatus)
router.use('/announcements', announcementRouter)

// Admin Coupon Routes
router.get('/coupons', adminAuth, couponCtrl.getAll)
router.get('/coupons/:id', adminAuth, couponCtrl.getById)
router.post('/coupons', adminAuth, couponCtrl.create)
router.put('/coupons/:id', adminAuth, couponCtrl.update)
router.patch('/coupons/:id/status', adminAuth, couponCtrl.updateStatus)
router.delete('/coupons/:id', adminAuth, couponCtrl.remove)

export default router
