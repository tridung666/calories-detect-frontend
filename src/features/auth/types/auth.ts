export type RegisterRequest = { fullName: string; email: string; password: string }
export type VerifyEmailRequest = { email: string; otp: string }
export type ResendOtpRequest = { email: string }
export type ForgotPasswordRequest = { email: string }
export type RequestPasswordChangeRequest = { currentPassword: string }
export type PasswordConfirmationValues = {
  otp: string
  newPassword: string
  confirmPassword: string
}
export type ResetPasswordRequest = PasswordConfirmationValues & { email: string }

export type RegisteredUser = {
  id: number
  email: string
  fullName: string
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "INACTIVE"
  emailVerified: boolean
}
export type SetPasswordRequest = { newPassword: string; confirmPassword: string }
