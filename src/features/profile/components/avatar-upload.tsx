import { useState } from "react"

import { useTranslation } from "react-i18next"

import { ImageUpload } from "@/components/ui/image-upload"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useDeleteAvatar, useUploadAvatar } from "@/features/profile/hooks/use-upload-avatar"
import type { User } from "@/features/profile/types/user"
import { getInitials } from "@/lib/format"

export const AvatarUpload = ({ profile }: { profile: User }) => {
  const { t } = useTranslation(["profile"])
  const mutation = useUploadAvatar()
  const removal = useDeleteAvatar()
  const [removing, setRemoving] = useState(false)
  return (
    <>
      <ImageUpload
        avatar
        label={t("profile:avatar.label")}
        currentUrl={profile.avatarUrl}
        fallback={<span aria-hidden="true">{getInitials(profile.fullName)}</span>}
        pending={mutation.isPending || removal.isPending}
        error={mutation.error}
        onReset={mutation.reset}
        onUpload={(file, onSuccess) => mutation.mutate(file, { onSuccess })}
        removeLabel={t("profile:avatar.remove")}
        onRemove={() => {
          removal.reset()
          setRemoving(true)
        }}
      />
      <ConfirmDeleteDialog
        open={removing}
        onOpenChange={setRemoving}
        title={t("profile:avatar.deleteTitle")}
        description={t("profile:avatar.deleteDescription")}
        pending={removal.isPending}
        error={removal.error}
        onConfirm={() => removal.mutate(undefined, { onSuccess: () => setRemoving(false) })}
      />
    </>
  )
}
