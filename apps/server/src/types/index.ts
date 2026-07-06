import { Request } from 'express'
import { Role } from '@veolms/shared'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
      query: Record<string, any>;
    }
  }
}

export interface AuthRequest extends Request {
  user?: { id: string; role: Role }
}
