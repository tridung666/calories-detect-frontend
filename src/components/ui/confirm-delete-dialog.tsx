import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MutationError } from "@/components/ui/feedback"
import { SubmitButton } from "@/components/ui/submit-button"

type ConfirmDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  pending: boolean
  error: unknown
  onConfirm: () => void
}

export const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  title,
  description,
  pending,
  error,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  const { t } = useTranslation(["common"])
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <MutationError error={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("common:actions.cancel")}</AlertDialogCancel>
          <SubmitButton type="button" variant="destructive" pending={pending} onClick={onConfirm}>
            {t("common:actions.confirmDelete")}
          </SubmitButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
