import { Router } from 'express'
import * as ctrl from './announcement.controller'

const router = Router()

router.post('/', ...ctrl.create)
router.get('/', ...ctrl.list)
router.get('/:id', ...ctrl.getOne)
router.post('/:id/duplicate', ...ctrl.duplicate)
router.delete('/:id', ...ctrl.remove)

export default router
