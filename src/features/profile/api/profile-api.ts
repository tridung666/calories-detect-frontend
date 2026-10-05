import type { User } from "@/features/profile/types/user"
import type { ApiSuccessResponse } from "@/lib/api/api-types"
import { apiClient } from "@/lib/axios"
import { imageFormData, imageUploadConfig } from "@/lib/api/image-upload"

export const getProfile = async (userId: number, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiSuccessResponse<User>>(`/user/${userId}`, { signal })
  return response.data.data
}

export const uploadAvatar = async (file: File) => {
  const response = await apiClient.put<ApiSuccessResponse<User>>(
    "/users/me/avatar",
    imageFormData(file),
    imageUploadConfig,
  )
  return response.data.data
}

export const deleteAvatar = async () => {
  const response = await apiClient.delete<ApiSuccessResponse<User>>("/users/me/avatar")
  return response.data.data
}
