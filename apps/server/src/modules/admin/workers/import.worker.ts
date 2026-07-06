import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { logger } from '../../../utils/logger'
import { Course } from '../../course/course.model'
import { User } from '../../user/user.model'
import * as xlsx from 'xlsx'
import fs from 'fs/promises'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const adminImportWorker = new Worker(
  'adminImport',
  async (job) => {
    logger.info(`Processing admin import job ${job.id} for type: ${job.data.type}`)
    const { type, filePath } = job.data

    try {
      const workbook = xlsx.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[]

      let imported = 0
      let skipped = 0

      if (type === 'courses') {
        // Filter valid rows
        const validRows = data.filter(row => row.title && row.slug)
        const skippedCountInitial = data.length - validRows.length
        
        // Find existing slugs
        const slugs = validRows.map(r => r.slug)
        const existingCourses = await Course.find({ slug: { $in: slugs } }, { slug: 1 }).lean()
        const existingSlugs = new Set(existingCourses.map(c => c.slug))

        // Prepare new courses for batch insert
        const coursesToInsert = validRows
          .filter(row => !existingSlugs.has(row.slug))
          .map(row => ({
            title: row.title,
            slug: row.slug,
            description: row.description || '',
            shortDescription: row.shortDescription || '',
            price: row.price || 0,
            originalPrice: row.originalPrice || row.price || 0,
            category: row.category || 'General',
            level: row.level || 'beginner',
            isPublished: row.isPublished === 'true' || row.isPublished === true
          }))

        if (coursesToInsert.length > 0) {
          // Perform bulk insert
          await Course.insertMany(coursesToInsert, { ordered: false })
          imported = coursesToInsert.length
        }
        
        skipped = skippedCountInitial + (validRows.length - imported)
      } 
      else if (type === 'students') {
        const validRows = data.filter(row => row.email && row.name)
        const skippedCountInitial = data.length - validRows.length

        // Pre-compute email hashes
        const rowsWithHash = validRows.map(row => ({
          ...row,
          hash: crypto.createHash('sha256').update(row.email.toLowerCase().trim()).digest('hex')
        }))

        // Find existing users
        const hashes = rowsWithHash.map(r => r.hash)
        const existingUsers = await User.find({ emailHash: { $in: hashes } }, { emailHash: 1 }).lean()
        const existingHashes = new Set(existingUsers.map(u => u.emailHash))

        // Hash passwords in parallel
        const usersToInsert = await Promise.all(
          rowsWithHash
            .filter(row => !existingHashes.has(row.hash))
            .map(async (row) => {
              const password = await bcrypt.hash(row.password || 'TempPassword123!', 10)
              return {
                name: row.name,
                email: row.email,
                password,
                role: 'student',
                isActive: true
              }
            })
        )

        if (usersToInsert.length > 0) {
          await User.insertMany(usersToInsert, { ordered: false })
          imported = usersToInsert.length
        }
        
        skipped = skippedCountInitial + (validRows.length - imported)
      } else {
        throw new Error('Unknown import type')
      }

      await fs.unlink(filePath).catch(() => {})
      return { imported, skipped, total: data.length }
    } catch (err: any) {
      await fs.unlink(filePath).catch(() => {})
      throw err
    }
  },
  { connection: redis }
)

adminImportWorker.on('completed', (job) => {
  logger.info(`Admin import job ${job.id} completed successfully. Imported: ${job.returnvalue.imported}, Skipped: ${job.returnvalue.skipped}`)
})

adminImportWorker.on('failed', (job, err) => {
  logger.error(`Admin import job ${job?.id} failed:`, err)
})
