import type { User } from "@/features/profile/types/user"
import type { ApiResponse } from "@/lib/api/api-types"
import { apiClient } from "@/lib/axios"

export const getProfile = async (userId: number, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiResponse<User>>(`/user/${userId}`, { signal })
  return response.data.data
}
