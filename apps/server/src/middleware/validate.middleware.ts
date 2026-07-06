import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { ApiError } from '../utils/apiError'

/**
 * Recursively sanitizes objects by removing keys that start with '$'
 * to prevent NoSQL injection via MongoDB operators.
 */
function sanitizeNoSql(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeNoSql)
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      // Drop keys that contain MongoDB operators
      if (key.startsWith('$')) {
        continue
      }
      sanitized[key] = sanitizeNoSql(obj[key])
    }
    return sanitized
  }
  return obj
}

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Sanitize input first
    req[source] = sanitizeNoSql(req[source])

    // Validate using Zod (which also strips out undeclared fields, preventing parameter pollution)
    const result = schema.safeParse(req[source])
    
    if (!result.success) {
      // Map Zod errors into a readable string
      const errorMessage = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new ApiError(400, errorMessage)
    }
    
    // Assign validated and stripped data back to request
    req[source] = result.data
    next()
  }
}
