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
  14000: "mealNotFound",
  14002: "foodNotFound",
}

const statusMessages: Partial<Record<number, ErrorKey>> = {
  400: "badRequest",
  401: "sessionExpired",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
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
  const key = businessMessages[data?.code] ?? statusMessages[status]
  if (key) return i18n.t(`errors:${key}`)
  return status >= 500 ? i18n.t("errors:server") : fallbackMessage
}
