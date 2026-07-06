import { createServer } from 'http'
import app from './app'
import { connectDB } from './config/db'
import { setupSocket } from './config/socket'
import { env } from './config/env'
import { logger } from './utils/logger'
import { initVideoSocket } from './utils/videoSocket'

async function start() {
  await connectDB()

  const httpServer = createServer(app)
  const io = setupSocket(httpServer)
  app.set('io', io)
  initVideoSocket(io)

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`)
  })
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message })
  process.exit(1)
})
