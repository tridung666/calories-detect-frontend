export type ApiSuccessResponse<T> = {
  success: true
  code: 200
  message: string
  data: T
}

export type ApiErrorResponse = {
  success: false
  code: number
  message: string
  data?: never
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export type PageParams = { page: number; size: number }

export type PageResponse<T> = PageParams & {
  content: T[]
  totalElements: number
  totalPages: number
}

export type BackendPageResponse<T> = {
  data: T[]
  pageNo: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}
