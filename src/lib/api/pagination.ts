import type { BackendPageResponse, PageParams, PageResponse } from "@/lib/api/api-types"

// Keep the backend's pageNo/pageSize contract out of UI components.
export const toPageParams = ({ page, size }: PageParams) => ({ pageNo: page, pageSize: size })

export const normalizePage = <T>(page: BackendPageResponse<T>): PageResponse<T> => ({
  content: page.data,
  page: page.pageNo,
  size: page.pageSize,
  totalElements: page.totalElements,
  totalPages: page.totalPages,
})
