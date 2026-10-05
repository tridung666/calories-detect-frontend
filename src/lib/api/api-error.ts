import axios from "axios"

import type { ApiErrorResponse } from "@/lib/api/api-types"
import { i18n } from "@/lib/i18n/i18n"
import type messages from "@/locales/en/errors.json"

type ErrorKey = keyof typeof messages

const businessMessages: Partial<Record<number, ErrorKey>> = {
  10001: "emailTaken",
  10002: "accountNotFound",
  10003: "accountInactive",
  11000: "sessionExpired",
  11001: "invalidCredentials",
  11002: "incorrectPassword",
  11003: "passwordMismatch",
  11004: "googleVerification",
  11005: "emailNotVerified",
  11006: "invalidOtp",
  11007: "googleAccountConflict",
  11008: "emailDeliveryFailed",
  11009: "localPasswordRequired",
  11010: "otpRateLimited",
  11012: "invalidNewPassword",
  11013: "localPasswordExists",
  13000: "sessionExpired",
  13001: "sessionExpired",
  13002: "sessionExpired",
  14000: "mealNotFound",
  14002: "foodNotFound",
  15000: "invalidImage",
  15001: "imageTooLarge",
  15002: "imageUploadFailed",
  15003: "imageDeleteFailed",
}

const statusMessages: Partial<Record<number, ErrorKey>> = {
  400: "badRequest",
  401: "sessionExpired",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
  413: "imageTooLarge",
  429: "tooManyRequests",
}

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = i18n.t("errors:generic"),
): string => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage
  }

  if (error.code === "ECONNABORTED") return i18n.t("errors:timeout")

  if (!error.response) {
    return i18n.t("errors:network")
  }

  const { status, data } = error.response
  const businessKey = businessMessages[data?.code]
  if (businessKey) return i18n.t(`errors:${businessKey}`)
  // Preserve validation/business messages not yet represented by a localized code.
  if (status < 500 && typeof data?.message === "string" && data.message.trim()) return data.message
  const key = statusMessages[status]
  if (key) return i18n.t(`errors:${key}`)
  return status >= 500 ? i18n.t("errors:server") : fallbackMessage
}

export const getApiErrorCode = (error: unknown): number | undefined =>
  axios.isAxiosError<ApiErrorResponse>(error) ? error.response?.data?.code : undefined
