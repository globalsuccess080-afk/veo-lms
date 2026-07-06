import { Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/generateToken'
import { ApiError } from '../utils/apiError'
import { AuthRequest } from '../types'

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required')
  }
  const token = header.split(' ')[1]
  try {
    req.user = verifyAccessToken(token)
  } catch {
    throw new ApiError(401, 'Session expired')
  }
  next()
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.split(' ')[1])
    } catch {}
  }
  next()
}
