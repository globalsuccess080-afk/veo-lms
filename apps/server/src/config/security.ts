import { env } from './env'

const frontendUrl = new URL(env.FRONTEND_URL)

function toOrigin(url: URL) {
  return `${url.protocol}//${url.host}`
}

function withHostname(hostname: string) {
  const clone = new URL(frontendUrl.toString())
  clone.hostname = hostname
  return toOrigin(clone)
}

export const primaryFrontendOrigin = toOrigin(frontendUrl)

export const allowedFrontendOrigins = (() => {
  const origins = new Set<string>([primaryFrontendOrigin])

  if (frontendUrl.hostname.startsWith('www.')) {
    origins.add(withHostname(frontendUrl.hostname.slice(4)))
  } else {
    origins.add(withHostname(`www.${frontendUrl.hostname}`))
  }

  return Array.from(origins)
})()

export function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return value
  }
}

export function isAllowedFrontendOrigin(origin?: string) {
  if (!origin) return true

  const normalizedOrigin = normalizeOrigin(origin)
  return allowedFrontendOrigins.includes(normalizedOrigin)
}
