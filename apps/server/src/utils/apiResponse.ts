import { Response } from 'express'

export function sendSuccess<T>(res: Response, data: T, message = 'Success', status = 200, meta?: object) {
  res.status(status).json({ success: true, message, data, meta })
}

export function sendError(res: Response, message: string, status = 500) {
  res.status(status).json({ success: false, message, data: null, error: message })
}
