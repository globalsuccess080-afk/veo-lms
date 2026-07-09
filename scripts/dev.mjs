import { spawn } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function start(label, args) {
  const child = spawn(npm, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`)
      shutdown(code ?? 1)
    }
  })

  return child
}

const server = start('server', ['run', 'dev', '-w', '@veolms/server'])
const client = start('client', ['run', 'dev', '-w', '@veolms/client'])
const worker = start('worker', ['run', 'worker', '-w', '@veolms/server'])

function shutdown(code = 0) {
  server.kill()
  client.kill()
  worker.kill()
  process.exit(code)
}

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
