import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/apiError'
import { sendError } from '../utils/apiResponse'
import { logger } from '../utils/logger'
import { env } from '../config/env'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode)
  }
  if (err.name === 'MulterError') {
    const message = err.message === 'File too large' ? 'File is too large. Please upload a smaller file.' : err.message
    return sendError(res, message, 400)
  }
  logger.error(err.message, { stack: err.stack })
  const message = env.NODE_ENV === 'production' ? 'Something went wrong on our side. Please try again in a moment.' : err.message
  sendError(res, message, 500)
}
