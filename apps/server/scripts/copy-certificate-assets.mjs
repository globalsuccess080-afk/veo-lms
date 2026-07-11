import fs from 'fs'
import path from 'path'

const root = process.cwd()
const src = path.join(root, 'src', 'modules', 'certificate')
const dest = path.join(root, 'dist', 'modules', 'certificate')

for (const dir of ['assets', 'fonts']) {
  fs.cpSync(path.join(src, dir), path.join(dest, dir), { recursive: true })
}
