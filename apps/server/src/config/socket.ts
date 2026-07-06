import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { verifyAccessToken } from '../utils/generateToken'
import { env } from './env'

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true }
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Auth required'))
    try {
      const user = verifyAccessToken(token)
      socket.data.user = user
      socket.join(`user:${user.id}`)
      if (user.role === 'admin') socket.join('role:admin')
      if (user.role === 'student') socket.join('role:student')
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('mark_read', async (data: { notificationId: string }) => {
      try {
        const { markRead, getUnreadCount } = await import('../modules/notification/notification.service')
        await markRead(socket.data.user.id, data.notificationId)
        const { unread } = await getUnreadCount(socket.data.user.id)
        socket.emit('notification:read', { id: data.notificationId })
        socket.emit('notification:unread_count', { unread })
      } catch (err) {
        console.error('Socket mark_read error:', err)
      }
    })
  })

  return io
}
