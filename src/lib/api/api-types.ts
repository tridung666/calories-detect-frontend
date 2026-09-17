export type ApiResponse<T> = {
  success?: boolean
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
