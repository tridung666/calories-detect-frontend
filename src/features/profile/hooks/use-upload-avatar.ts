import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteAvatar, uploadAvatar } from "@/features/profile/api/profile-api"
import { i18n } from "@/lib/i18n/i18n"
import { notification } from "@/lib/notification"

export const useUploadAvatar = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async (profile) => {
      await client.cancelQueries({ queryKey: ["profile", profile.id] })
      client.setQueryData(["profile", profile.id], profile)
      notification.success(i18n.t("profile:avatar.success"))
      await client.invalidateQueries({ queryKey: ["profile", profile.id] })
    },
  })
}

export const useDeleteAvatar = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: async (profile) => {
      await client.cancelQueries({ queryKey: ["profile", profile.id] })
      client.setQueryData(["profile", profile.id], profile)
      notification.success(i18n.t("profile:avatar.deleted"))
      await client.invalidateQueries({ queryKey: ["profile", profile.id] })
    },
  })
}
