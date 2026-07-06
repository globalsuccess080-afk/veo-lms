import { Router } from 'express'
import * as ctrl from './course.controller'

const router = Router()

router.get('/', ctrl.list)
router.get('/featured', ctrl.featured)
router.get('/categories', ctrl.categories)
router.get('/search', ctrl.search)
router.get('/manage/all', ...ctrl.adminList)
router.get('/manage/:id', ...ctrl.getById)
router.get('/:slug/curriculum', ctrl.curriculum)
router.get('/:slug', ctrl.getBySlug)
router.post('/', ...ctrl.create)
router.post('/bulk-delete', ...ctrl.bulkRemove)
router.put('/:id', ...ctrl.update)
router.delete('/:id', ...ctrl.remove)
router.patch('/:id/publish', ...ctrl.publish)
router.post('/:id/sections', ...ctrl.addSection)
router.put('/:id/sections/reorder', ...ctrl.reorderSections)
router.put('/:id/sections/:sectionId', ...ctrl.updateSection)
router.delete('/:id/sections/:sectionId', ...ctrl.removeSection)

export default router
