import { useSearchParams } from "react-router"

import type { PageParams } from "@/lib/api/api-types"

export const useListParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get("page") ?? 1)
  const requestedSize = Number(searchParams.get("size") ?? 10)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage - 1 : 0
  const size = [10, 20, 50].includes(requestedSize) ? requestedSize : 10

  const updateParams = (values: Record<string, string | undefined>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    })
  }

  return {
    searchParams,
    page,
    size,
    updateParams,
    onPageChange: (params: PageParams) =>
      updateParams({ page: String(params.page + 1), size: String(params.size) }),
  }
}
