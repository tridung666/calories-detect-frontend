export type ApiResponse<T> = {
  success: boolean
  code: number
  message: string
  data: T
}

export type ApiErrorResponse = {
  success: false
  code: number
  message: string
  data?: unknown
}