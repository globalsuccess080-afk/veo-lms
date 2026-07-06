import crypto from 'crypto'
import { env } from '../config/env'
import { ApiError } from '../utils/apiError'

// Load keys from environment (expecting base64 encoded PEM to avoid multiline .env issues)
// In production, these should be strictly managed and not hardcoded
const publicKeyPem = env.RSA_PUBLIC_KEY ? Buffer.from(env.RSA_PUBLIC_KEY, 'base64').toString('utf8') : ''
const privateKeyPem = env.RSA_PRIVATE_KEY ? Buffer.from(env.RSA_PRIVATE_KEY, 'base64').toString('utf8') : ''

if (env.ENABLE_PAYLOAD_ENCRYPTION && (!publicKeyPem || !privateKeyPem)) {
  console.warn('WARNING: Payload encryption is enabled but RSA keys are missing from environment.')
}

/**
 * Returns the RSA Public Key (PEM format) exposed to the frontend.
 */
export function getPublicKey(): string {
  return publicKeyPem
}

/**
 * Decrypts the AES session key using the backend RSA Private Key.
 * @param encryptedKeyBase64 The base64-encoded encrypted AES key from the frontend
 * @returns The decrypted AES key as a Buffer
 */
export function decryptAESKey(encryptedKeyBase64: string): Buffer {
  if (!privateKeyPem) {
    throw new ApiError(500, 'RSA Private Key is not configured on the server')
  }

  try {
    const encryptedBuffer = Buffer.from(encryptedKeyBase64, 'base64')
    const decryptedBuffer = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedBuffer
    )
    return decryptedBuffer
  } catch (error) {
    throw new ApiError(400, 'Failed to decrypt AES session key')
  }
}
