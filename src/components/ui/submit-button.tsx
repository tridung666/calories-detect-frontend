import type { ComponentProps } from "react"

import { LoaderCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export const SubmitButton = ({
  pending,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean }) => {
  const { t } = useTranslation(["common"])
  return (
    <Button type="submit" {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending && <LoaderCircle className="animate-spin" />}
      {pending ? t("common:feedback.processing") : children}
    </Button>
  )
}
