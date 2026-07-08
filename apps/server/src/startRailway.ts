import { spawnSync } from 'child_process'

const role = process.env.SERVICE_ROLE
const isWorker = role === 'worker'
const entry = isWorker ? 'dist/worker.js' : 'dist/server.js'

console.log(`Starting ${isWorker ? 'worker' : 'server'} process: ${entry}`)

const result = spawnSync(process.execPath, [entry], { stdio: 'inherit' })
process.exit(result.status ?? 1)
