import { execSync } from 'child_process'
try {
  execSync('git checkout -- apps/server/src/modules/lesson/lesson.service.ts apps/server/src/modules/video/video.controller.ts')
  console.log('Reverted files successfully.')
} catch (e) {
  console.error('Failed to revert', e.message)
}
