/**
 * Directly uploads an already-transcoded HLS temp directory to R2.
 * Run: node scripts/upload-hls.mjs <lessonId>
 * Example: node scripts/upload-hls.mjs 6a43dc7b29d77e7acfd84772
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readdir, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { lookup } from 'mime-types'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load env
const candidates = [resolve('.env'), resolve('../../.env')]
for (const f of candidates) {
  if (existsSync(f)) { dotenv.config({ path: f }); break }
}

const lessonId = process.argv[2]
if (!lessonId) {
  console.error('Usage: node scripts/upload-hls.mjs <lessonId>')
  process.exit(1)
}

const TEMP_DIR = resolve('apps/server/uploads/temp', lessonId)
if (!existsSync(TEMP_DIR)) {
  console.error(`Temp dir not found: ${TEMP_DIR}`)
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// Collect all files recursively
async function collectFiles(dir, prefix) {
  const files = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const key = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, key))
    } else {
      const { size } = await stat(fullPath)
      files.push({ localPath: fullPath, key, size })
    }
  }
  return files
}

async function uploadFile(localPath, key, size) {
  const body = await readFile(localPath)
  const contentType = lookup(localPath) || 'application/octet-stream'
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: body.length,
  }))
}

console.log(`\n📦 Uploading HLS for lesson: ${lessonId}`)
console.log(`   Source: ${TEMP_DIR}`)
console.log(`   Dest:   videos/${lessonId}/\n`)

const destPrefix = `videos/${lessonId}`
const allFiles = await collectFiles(TEMP_DIR, destPrefix)

const totalSize = allFiles.reduce((s, f) => s + f.size, 0)
console.log(`Found ${allFiles.length} files (${(totalSize / 1024 / 1024).toFixed(1)} MB total)\n`)

const CONCURRENCY = 15
let uploaded = 0
let failed = 0
const errors = []

for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
  const batch = allFiles.slice(i, i + CONCURRENCY)
  const results = await Promise.allSettled(
    batch.map(async ({ localPath, key, size }) => {
      const start = Date.now()
      await uploadFile(localPath, key, size)
      const ms = Date.now() - start
      uploaded++
      const mb = (size / 1024 / 1024).toFixed(2)
      console.log(`  ✓ [${uploaded}/${allFiles.length}] ${path.basename(key)} (${mb}MB) — ${ms}ms`)
    })
  )
  for (const r of results) {
    if (r.status === 'rejected') {
      failed++
      errors.push(r.reason?.message)
      console.error(`  ✗ FAILED: ${r.reason?.message}`)
    }
  }
}

console.log(`\n${ failed === 0 ? '✅' : '⚠️' } Done: ${uploaded} uploaded, ${failed} failed`)
if (errors.length) {
  console.error('Errors:', errors)
}

process.exit(failed > 0 ? 1 : 0)
