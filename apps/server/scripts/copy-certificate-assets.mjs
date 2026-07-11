import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const src = path.join(root, 'src', 'modules', 'certificate')
const dest = path.join(root, 'dist', 'modules', 'certificate')

for (const dir of ['assets', 'fonts']) {
  const from = path.join(src, dir)
  if (!fs.existsSync(from)) {
    throw new Error(`Certificate ${dir} directory not found: ${from}`)
  }
  fs.cpSync(from, path.join(dest, dir), { recursive: true })
}
