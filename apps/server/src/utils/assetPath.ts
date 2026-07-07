
export function formatAssetPath(value: string | null | undefined): string {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (/^(data:|blob:)/i.test(value)) return value

  let key = value
  if (value.includes('://')) {
    try {
      key = decodeURIComponent(new URL(value).pathname).replace(/^\//, '')
    } catch {
      key = value.replace(/^\//, '')
    }
  } else {
    key = value.replace(/^\//, '')
  }

  return `/${key}`
}
