import type { AdminUserFormValues } from "@/features/admin/schemas/user-schema"
import type { User } from "@/features/profile/types/user"
import type { ApiSuccessResponse, BackendPageResponse, PageParams } from "@/lib/api/api-types"
import { normalizePage, toPageParams } from "@/lib/api/pagination"
import { apiClient } from "@/lib/axios"

export const getUsers = async (params: PageParams, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiSuccessResponse<BackendPageResponse<User>>>(
    "/admin/users",
    {
      params: toPageParams(params),
      signal,
    },
  )
  return normalizePage(response.data.data)
}

export const createUser = async (payload: AdminUserFormValues) => {
  const response = await apiClient.post<ApiSuccessResponse<User>>("/admin/users", payload)
  return response.data.data
}
