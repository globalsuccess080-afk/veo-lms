import { Router, Request, Response } from 'express'
import { getPublicKey } from '../../crypto/rsa.service'

const router = Router()

router.get('/public-key', (_req: Request, res: Response) => {
  const publicKey = getPublicKey()
  if (!publicKey) {
    return res.status(500).json({ success: false, message: 'RSA Public Key is not configured' })
  }

  res.json({ success: true, data: { publicKey } })
})

export default router
