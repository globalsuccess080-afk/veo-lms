import { Response, NextFunction } from 'express'
import { Role } from '@veolms/shared'
import { ApiError } from '../utils/apiError'
import { AuthRequest } from '../types'

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden')
    }
    next()
  }
}
