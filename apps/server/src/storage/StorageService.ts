import {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import { env } from '../config/env'
import { r2Client } from '../config/r2'

export class StorageService {
  private bucket = env.R2_BUCKET_NAME
  private publicUrl = env.R2_PUBLIC_URL.replace(/\/$/, '') // Ensure no trailing slash

  public getPublicUrl(keyOrUrl: string): string {
    if (!keyOrUrl) return keyOrUrl
    const key = this.extractKey(keyOrUrl)
    return `${this.publicUrl}/${key.replace(/^\//, '')}`
  }

  public extractKey(urlOrKey: string): string {
    if (!urlOrKey) return urlOrKey
    if (/^https?:\/\//i.test(urlOrKey)) {
      try {
        return decodeURIComponent(new URL(urlOrKey).pathname).replace(/^\//, '')
      } catch {
        return urlOrKey
      }
    }
    return urlOrKey.replace(/^\//, '')
  }

  public async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const getCommand = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    return getSignedUrl(r2Client, getCommand, { expiresIn })
  }

  public async readText(key: string): Promise<string> {
    const response = await r2Client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!response.Body) throw new Error(`Storage object has no body: ${key}`)
    return response.Body.transformToString('utf-8')
  }

  public async uploadFile(localPath: string, key: string): Promise<{ key: string; url: string }> {
    // Read into buffer so ContentLength is always known — avoids the AWS SDK
    // "Invalid value undefined for x-amz-decoded-content-length" error that
    // occurs when piping a stream without providing ContentLength explicitly.
    const { size } = await fs.promises.stat(localPath)
    const body = fs.createReadStream(localPath)
    const contentType = mime.lookup(localPath) || 'application/octet-stream'
    const extension = path.extname(localPath).toLowerCase()
    const cacheControl = extension === '.m3u8' || extension === '.ts'
      ? 'private, max-age=0, no-store'
      : 'public, max-age=31536000, immutable'

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: size,
      CacheControl: cacheControl,
    })

    await r2Client.send(command)

    return {
      key,
      url: this.getPublicUrl(key)
    }
  }

  public async uploadBuffer(buffer: Buffer, key: string, contentType = 'application/octet-stream'): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await r2Client.send(command)

    return {
      key,
      url: this.getPublicUrl(key)
    }
  }

  public async uploadDirectory(
    localDirectory: string,
    destinationPrefix: string,
    onProgress?: (uploaded: number, total: number) => void,
    concurrency = 10
  ): Promise<void> {
    // Collect all files recursively first
    const allFiles: { localPath: string; key: string }[] = []

    const collect = async (dir: string, prefix: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relKey = path.posix.join(prefix, entry.name)
        if (entry.isDirectory()) {
          await collect(fullPath, relKey)
        } else {
          allFiles.push({ localPath: fullPath, key: relKey })
        }
      }
    }
    await collect(localDirectory, destinationPrefix)

    const total = allFiles.length
    let uploaded = 0

    // Upload in parallel batches of `concurrency`
    let nextIndex = 0
    const worker = async () => {
      while (nextIndex < allFiles.length) {
        const file = allFiles[nextIndex++]
        await this.uploadFile(file.localPath, file.key)
        uploaded += 1
        onProgress?.(uploaded, total)
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker))
  }

  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    await r2Client.send(command)
  }

  public async deleteDirectory(prefix: string): Promise<void> {
    // R2 doesn't have a real directory delete, we must list and delete
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    })

    let isTruncated = true
    let continuationToken: string | undefined

    while (isTruncated) {
      listCommand.input.ContinuationToken = continuationToken
      const response = await r2Client.send(listCommand)
      
      if (!response.Contents || response.Contents.length === 0) break

      const deletePromises = response.Contents.map(obj => {
        if (obj.Key) {
          return this.deleteFile(obj.Key)
        }
      })

      await Promise.all(deletePromises)

      isTruncated = response.IsTruncated ?? false
      continuationToken = response.NextContinuationToken
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
      await r2Client.send(command)
      return true
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw err
    }
  }

  public async copy(sourceKey: string, targetKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: targetKey,
    })
    await r2Client.send(command)
  }

  public async move(sourceKey: string, targetKey: string): Promise<void> {
    await this.copy(sourceKey, targetKey)
    await this.deleteFile(sourceKey)
  }

  public async getMetadata(key: string): Promise<Record<string, any>> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    const response = await r2Client.send(command)
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      eTag: response.ETag,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    }
  }
}

export const storageService = new StorageService()
