/**
 * Quick test: upload a small file to R2 and verify it works.
 * Run: node scripts/test-r2-upload.mjs
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/sdk-s3'
import { S3Client as S3, PutObjectCommand as Put } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

const candidates = [resolve('.env'), resolve('../../.env')]
for (const f of candidates) {
  if (existsSync(f)) { dotenv.config({ path: f }); break }
}

const client = new S3({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const body = Buffer.from('Hello from VeoLMS test!')

console.log('Uploading test file to R2...')
console.log('Endpoint:', process.env.R2_ENDPOINT)
console.log('Bucket:', process.env.R2_BUCKET_NAME)

try {
  await client.send(new Put({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: 'test/hello.txt',
    Body: body,
    ContentType: 'text/plain',
    ContentLength: body.length,
  }))
  const publicUrl = `${process.env.R2_PUBLIC_URL}/test/hello.txt`
  console.log('✅ Upload SUCCESS! File URL:', publicUrl)
} catch (err) {
  console.error('❌ Upload FAILED:', err.message)
  console.error(err)
}
