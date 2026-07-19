import axios from "axios"

import type { ApiErrorResponse } from "@/lib/api/api-types"

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Đã xảy ra lỗi. Vui lòng thử lại.",
): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage
  }

  if (!error.response) {
    return "Không thể kết nối đến máy chủ."
  }

  return error.response.data?.message ?? fallbackMessage
}
