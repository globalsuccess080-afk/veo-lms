import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { decryptAESKey } from './rsa.service'
import { decryptPayload, encryptPayload } from './aes.service'
import { ApiError } from '../utils/apiError'

const ENCRYPTABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export function globalEncryptionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (
    !env.ENABLE_PAYLOAD_ENCRYPTION ||
    !ENCRYPTABLE_METHODS.includes(req.method) ||
    // Skip if it's a file upload request (multipart/form-data)
    req.headers['content-type']?.includes('multipart/form-data')
  ) {
    return next()
  }

  const { encryptedKey, data, iv, tag } = req.body

  if (!encryptedKey || !data || !iv || !tag) {
    return next(new ApiError(400, 'Invalid encrypted payload format'))
  }

  let aesKeyBuffer: Buffer | null = null

  try {
    // 1. Decrypt AES Key using RSA Private Key
    aesKeyBuffer = decryptAESKey(encryptedKey)

    // 2. Decrypt the request payload
    const decryptedString = decryptPayload(data, iv, tag, aesKeyBuffer)
    req.body = JSON.parse(decryptedString)
  } catch (error) {
    if (aesKeyBuffer) {
      aesKeyBuffer.fill(0) // Securely wipe the key
      aesKeyBuffer = null
    }
    return next(new ApiError(400, 'Failed to decrypt request payload'))
  }

  // 3. Intercept the response to encrypt it before sending
  const originalJson = res.json.bind(res)

  // @ts-ignore
  res.json = (body: any) => {
    if (!aesKeyBuffer) {
      return originalJson(body)
    }

    try {
      const responseString = JSON.stringify(body)
      const { encryptedData, iv: outIv, authTag } = encryptPayload(responseString, aesKeyBuffer)

      const encryptedResponse = {
        data: encryptedData,
        iv: outIv,
        tag: authTag
        // encryptedKey is omitted because the frontend already has the session key
      }

      // 4. Securely destroy the AES key from memory
      aesKeyBuffer.fill(0)
      aesKeyBuffer = null

      return originalJson(encryptedResponse)
    } catch (error) {
      if (aesKeyBuffer) {
        aesKeyBuffer.fill(0)
        aesKeyBuffer = null
      }
      return originalJson({
        success: false,
        message: 'Failed to encrypt response payload'
      })
    }
  }

  next()
}
