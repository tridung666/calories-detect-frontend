import { describe, expect, it } from "vitest"

import { getReturnTo, readSession } from "@/features/auth/lib/session"
import { registerSchema } from "@/features/auth/schemas/auth-schema"

describe("session and account boundaries", () => {
  it.each([null, "malformed", "a.not-json.c", "a.e30.c"])("ignores malformed JWT %s", (token) => {
    expect(readSession(token)).toBeNull()
  })

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/auth/login"])(
    "rejects unsafe return destination %s",
    (path) => {
      expect(getReturnTo(`?next=${encodeURIComponent(path)}`)).toBe("/dashboard")
    },
  )

  it("preserves internal paths and filters after login", () => {
    expect(getReturnTo("?next=%2Fmeals%3Fpage%3D2")).toBe("/meals?page=2")
  })

  it("validates password confirmation and the BCrypt byte limit", () => {
    const user = {
      fullName: "Test User",
      email: "test@example.com",
      password: "password1",
      confirmPassword: "password1",
    }
    expect(registerSchema.safeParse(user).success).toBe(true)
    expect(registerSchema.safeParse({ ...user, confirmPassword: "password2" }).success).toBe(false)
    const longPassword = "ệ".repeat(30)
    expect(
      registerSchema.safeParse({ ...user, password: longPassword, confirmPassword: longPassword })
        .success,
    ).toBe(false)
  })
})
