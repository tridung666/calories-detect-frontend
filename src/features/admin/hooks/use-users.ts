import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { i18n } from "@/lib/i18n/i18n"
import { createUser, getUsers } from "@/features/admin/api/users-api"
import type { PageParams } from "@/lib/api/api-types"
import { notification } from "@/lib/notification"

export const useUsers = (params: PageParams) =>
  useQuery({
    queryKey: ["users", params],
    queryFn: ({ signal }) => getUsers(params, signal),
  })

export const useCreateUser = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      notification.success(i18n.t("admin:created"))
      await client.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
