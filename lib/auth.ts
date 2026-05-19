import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string) {
  try {
    const [salt, key] = stored.split(':')
    if (!salt || !key) return false
    const derived = scryptSync(password, salt, 64)
    const keyBuf = Buffer.from(key, 'hex')
    return timingSafeEqual(keyBuf, derived)
  } catch (e) {
    return false
  }
}

export function createSessionToken() {
  return randomBytes(48).toString('hex')
}
