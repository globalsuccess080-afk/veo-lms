import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'
import { PDFDocument, PDFFont, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { logger } from '../../utils/logger'

const NAVY = rgb(13 / 255, 30 / 255, 64 / 255)
const NAVY2 = rgb(22 / 255, 46 / 255, 92 / 255)
const GOLD = rgb(176 / 255, 141 / 255, 87 / 255)
const TEXT = rgb(35 / 255, 38 / 255, 48 / 255)
const MUTED = rgb(120 / 255, 124 / 255, 138 / 255)

function clean(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, '').trim()
}

const KNOWN_CASING: Record<string, string> = {
  js: 'JS', jsx: 'JSX', ts: 'TS', tsx: 'TSX',
  api: 'API', apis: 'APIs', sql: 'SQL', html: 'HTML', css: 'CSS',
  aws: 'AWS', gcp: 'GCP', ui: 'UI', ux: 'UX', ai: 'AI', ml: 'ML',
  json: 'JSON', xml: 'XML', http: 'HTTP', https: 'HTTPS',
  css3: 'CSS3', html5: 'HTML5', php: 'PHP', seo: 'SEO',
  javascript: 'JavaScript', typescript: 'TypeScript', graphql: 'GraphQL',
  mongodb: 'MongoDB', mysql: 'MySQL', postgresql: 'PostgreSQL',
  nodejs: 'Node.js', 'node.js': 'Node.js', reactjs: 'React.js',
  nextjs: 'Next.js', 'next.js': 'Next.js', vuejs: 'Vue.js',
  devops: 'DevOps', ios: 'iOS',
}
const LOWERCASE_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

function titleCaseCourse(raw: string): string {
  const cleaned = clean(raw)
  if (!cleaned) return cleaned
  const words = cleaned.split(/\s+/)
  const titled = words
    .map((word, i) => {
      const lower = word.toLowerCase()
      const bareKey = lower.replace(/[^a-z0-9.]/g, '')
      if (KNOWN_CASING[bareKey]) {
        const trailing = word.match(/[^a-zA-Z0-9.]*$/)?.[0] ?? ''
        return KNOWN_CASING[bareKey] + trailing
      }
      if (i > 0 && LOWERCASE_WORDS.has(lower)) return lower
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
  return titled.replace(/\b(Next|Node|React|Vue)\s+JS\b/g, '$1.js')
}

function cx(text: string, size: number, font: PDFFont, W: number): number {
  return (W - font.widthOfTextAtSize(text, size)) / 2
}

function textW(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size)
}

export async function generatePDF(data: {
  studentName: string
  courseName: string
  date: string
  certId: string
  publicUrl: string
  instructorName?: string
}): Promise<Uint8Array> {

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  const dir = path.join(__dirname, 'fonts')
  const fCorm = await doc.embedFont(fs.readFileSync(path.join(dir, 'Cormorant-SemiBold.ttf')))
  const fInter = await doc.embedFont(fs.readFileSync(path.join(dir, 'Inter-Regular.ttf')))
  const fVibes = await doc.embedFont(fs.readFileSync(path.join(dir, 'GreatVibes-Regular.ttf')))

  const templateBytes = fs.readFileSync(path.join(__dirname, 'assets', 'template.png'))
  const templateImg = await doc.embedPng(templateBytes)

  const W = templateImg.width
  const H = templateImg.height
  const MX = W / 2
  const page = doc.addPage([W, H])

  page.drawImage(templateImg, { x: 0, y: 0, width: W, height: H })

  const studentName = clean(data.studentName)
  const courseName = titleCaseCourse(data.courseName)
  const certDate = clean(data.date)
  const certId = clean(data.certId)
  const instructorName = clean(data.instructorName || 'Anurag Singh')

  const nSz = studentName.length > 28 ? 44 : studentName.length > 20 ? 54 : studentName.length > 14 ? 64 : 76
  page.drawText(studentName, {
    x: cx(studentName, nSz, fCorm, W), y: H - 515, size: nSz, font: fCorm, color: NAVY,
  })

  const maxCourseW = W - 300
  let courseSz = 28
  while (textW(fInter, courseName, courseSz) > maxCourseW && courseSz > 14) {
    courseSz -= 0.5
  }
  page.drawText(courseName, {
    x: cx(courseName, courseSz, fInter, W), y: H - 645, size: courseSz, font: fInter, color: NAVY,
  })

  page.drawText(certDate, {
    x: 309 - textW(fInter, certDate, 13) / 2, y: H - 1012, size: 13, font: fInter, color: NAVY,
  })

  const sigSz = instructorName.length > 22 ? 18 : 22
  page.drawText(instructorName, {
    x: MX - textW(fVibes, instructorName, sigSz) / 2, y: H - 1024, size: sigSz, font: fVibes, color: NAVY2,
  })

  try {
    const qrBuf = await QRCode.toBuffer(data.publicUrl, {
      type: 'png', margin: 0, color: { dark: '#0D1E40', light: '#FFFFFF' },
    })
    const qrImg = await doc.embedPng(qrBuf)
    const QR = 88
    const QRX = 1052 - QR / 2
    const QRY = H - 950
    page.drawImage(qrImg, { x: QRX, y: QRY, width: QR, height: QR })

    const cidSz = certId.length > 14 ? 7.5 : 9
    page.drawText(certId, {
      x: 1052 - textW(fInter, certId, cidSz) / 2, y: H - 966, size: cidSz, font: fInter, color: MUTED,
    })
  } catch (err) {
    logger.error('QR generation failed', err)
  }

  return doc.save()
}
