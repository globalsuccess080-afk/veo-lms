import bcrypt from 'bcrypt'
import bcryptjs from 'bcryptjs'
import { logger } from './logger'

const TARGET_BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10)
let warnedNativeFallback = false

async function withNative<T>(operation: () => Promise<T>, fallback: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (!warnedNativeFallback) {
      warnedNativeFallback = true
      logger.warn('Native bcrypt failed, falling back to bcryptjs', {
        error: error instanceof Error ? error.message : error,
      })
    }
    return fallback()
  }
}

export function getTargetPasswordRounds() {
  return TARGET_BCRYPT_ROUNDS
}

export async function hashPassword(password: string, rounds = TARGET_BCRYPT_ROUNDS) {
  return withNative(
    () => bcrypt.hash(password, rounds),
    () => bcryptjs.hash(password, rounds)
  )
}

export async function verifyPassword(password: string, hash: string) {
  return withNative(
    () => bcrypt.compare(password, hash),
    () => bcryptjs.compare(password, hash)
  )
}

export function passwordNeedsRehash(hash: string, rounds = TARGET_BCRYPT_ROUNDS) {
  try {
    return bcrypt.getRounds(hash) !== rounds
  } catch {
    try {
      return bcryptjs.getRounds(hash) !== rounds
    } catch {
      return false
    }
  }
}
