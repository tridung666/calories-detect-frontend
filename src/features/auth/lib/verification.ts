const COOLDOWN_PREFIX = "calories-detect:otp-cooldown:"

// Only advisory deadlines are persisted; passwords and OTPs remain in form memory.
export const emailCooldownKey = (email: string) => `email:${email.trim().toLowerCase()}`
export const verificationCooldownKey = (email: string) =>
  `verify-email:${email.trim().toLowerCase()}`

export const readCooldown = (key: string) => {
  try {
    const value = Number(sessionStorage.getItem(COOLDOWN_PREFIX + key))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export const startCooldown = (key: string, seconds = 60) => {
  const until = Date.now() + seconds * 1000
  try {
    sessionStorage.setItem(COOLDOWN_PREFIX + key, String(until))
  } catch {
    /* Advisory only. */
  }
  return until
}
