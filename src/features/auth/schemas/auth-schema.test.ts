import { describe, expect, it } from "vitest"

import {
  passwordConfirmationSchema,
  registerSchema,
  requestPasswordChangeSchema,
  otpSchema,
  forgotPasswordSchema,
} from "@/features/auth/schemas/auth-schema"

const password = "TestPass123!"

describe("auth contract validation", () => {
  it("trims identity fields without modifying passwords", () => {
    const result = registerSchema.parse({
      fullName: "  Minh Anh  ",
      email: " test@example.com ",
      password: " Password123! ",
      confirmPassword: " Password123! ",
    })
    expect(result).toMatchObject({
      fullName: "Minh Anh",
      email: "test@example.com",
      password: " Password123! ",
    })
  })

  it.each(["", "12345", "1234567", "12e456", "１２３４５６"])("rejects invalid OTP %j", (otp) => {
    expect(otpSchema.safeParse(otp).success).toBe(false)
    expect(
      passwordConfirmationSchema.safeParse({
        otp,
        newPassword: password,
        confirmPassword: password,
      }).success,
    ).toBe(false)
  })

  it("preserves leading zeroes and requires matching passwords", () => {
    expect(otpSchema.parse("001234")).toBe("001234")
    expect(
      passwordConfirmationSchema.safeParse({
        otp: "001234",
        newPassword: password,
        confirmPassword: "Different123!",
      }).success,
    ).toBe(false)
  })

  it.each(["short", "x".repeat(73), "ế".repeat(25), " ".repeat(8), "\t".repeat(8)])(
    "rejects passwords outside backend character/byte limits",
    (newPassword) => {
      expect(
        passwordConfirmationSchema.safeParse({
          otp: "123456",
          newPassword,
          confirmPassword: newPassword,
        }).success,
      ).toBe(false)
    },
  )

  it("accepts existing short passwords but requires a current password", () => {
    expect(requestPasswordChangeSchema.safeParse({ currentPassword: "legacy" }).success).toBe(true)
    expect(requestPasswordChangeSchema.safeParse({ currentPassword: "" }).success).toBe(false)
  })
})

it("validates email and accepts byte boundaries without changing passwords", () => {
  expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false)
  for (const newPassword of ["x".repeat(72), "ế".repeat(24), " Password123! "]) {
    expect(
      passwordConfirmationSchema.parse({ otp: "012345", newPassword, confirmPassword: newPassword })
        .newPassword,
    ).toBe(newPassword)
  }
})
