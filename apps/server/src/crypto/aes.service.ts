import crypto from 'crypto'
import { ApiError } from '../utils/apiError'

const ALGORITHM = 'aes-256-gcm'

/**
 * Decrypts a payload using AES-256-GCM.
 * @param encryptedData Base64 encoded encrypted payload
 * @param ivBase64 Base64 encoded Initialization Vector
 * @param authTagBase64 Base64 encoded Authentication Tag
 * @param aesKeyBuffer The AES session key buffer
 * @returns The decrypted payload string
 */
export function decryptPayload(
  encryptedData: string,
  ivBase64: string,
  authTagBase64: string,
  aesKeyBuffer: Buffer
): string {
  try {
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')
    const ciphertext = Buffer.from(encryptedData, 'base64')

    const decipher = crypto.createDecipheriv(ALGORITHM, aesKeyBuffer, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    throw new ApiError(400, 'Failed to decrypt AES payload')
  }
}

/**
 * Encrypts a payload using AES-256-GCM.
 * @param data The string payload to encrypt
 * @param aesKeyBuffer The AES session key buffer
 * @returns Object containing base64 encoded encrypted data, iv, and tag
 */
export function encryptPayload(
  data: string,
  aesKeyBuffer: Buffer
): { encryptedData: string; iv: string; authTag: string } {
  try {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, aesKeyBuffer, iv)

    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    }
  } catch (error) {
    throw new ApiError(500, 'Failed to encrypt AES payload')
  }
}
