import fs from 'fs'
const c = fs.readFileSync('apps/server/src/modules/video/workers/TranscodeWorker.ts', 'utf8')
const lines = c.split('\n').slice(258, 267)
console.log(lines.join('\n'))
