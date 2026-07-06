/**
 * Diagnostic: Tests if R2 upload actually works from this machine.
 * Run: node scripts/test-r2.mjs
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

const candidates = [resolve('.env'), resolve('../../.env')]
for (const f of candidates) {
  if (existsSync(f)) { dotenv.config({ path: f }); break }
}

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestHandler: {
    requestTimeout: 30_000,  // 30 second timeout
    connectionTimeout: 10_000,
  }
})

const body = Buffer.from('VeoLMS R2 upload test - ' + new Date().toISOString())

console.log('Testing R2 connectivity...')
console.log('  Endpoint  :', process.env.R2_ENDPOINT)
console.log('  Bucket    :', process.env.R2_BUCKET_NAME)
console.log('  Public URL:', process.env.R2_PUBLIC_URL)
console.log()

const start = Date.now()
try {
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'test/connectivity-check.txt',
    Body: body,
    ContentType: 'text/plain',
    ContentLength: body.length,
  }))
  console.log(`✅ Upload SUCCESS in ${Date.now() - start}ms`)
  console.log(`   URL: ${process.env.R2_PUBLIC_URL}test/connectivity-check.txt`)
} catch (err) {
  console.error(`❌ Upload FAILED in ${Date.now() - start}ms`)
  console.error('   Error:', err.message)
  if (err.Code) console.error('   Code:', err.Code)
  if (err.$metadata) console.error('   HTTP Status:', err.$metadata.httpStatusCode)
}

process.exit(0)
