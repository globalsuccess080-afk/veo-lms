const assetBase = (
  import.meta.env.VITE_ASSET_BASE_URL ||
  import.meta.env.VITE_VIDEO_ASSET_BASE_URL ||
  ''
).replace(/\/$/, '')
 
export function resolveAssetUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (/^(data:|blob:)/i.test(path)) return path

  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!assetBase) return normalized
  return `${assetBase}${normalized}`
}
