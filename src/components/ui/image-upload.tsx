import { useId, type ReactNode } from "react"

import { ImagePlus, Trash2, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { MutationError } from "@/components/ui/feedback"
import { ImagePreview } from "@/components/ui/image-preview"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/ui/submit-button"
import { useImageSelection } from "@/hooks/use-image-selection"
import { imageAccept } from "@/lib/image-file"
import { cn } from "@/lib/utils"

type ImageUploadProps = {
  label: string
  currentUrl?: string | null
  avatar?: boolean
  fallback?: ReactNode
  pending: boolean
  error: unknown
  onReset: () => void
  onUpload: (file: File, onSuccess: () => void) => void
  disabled?: boolean
  onSelectionChange?: (selected: boolean) => void
  onRemove?: () => void
  removeLabel?: string
}

export const ImageUpload = ({
  label,
  currentUrl,
  avatar,
  fallback,
  pending,
  error,
  onReset,
  onUpload,
  disabled = false,
  onSelectionChange,
  onRemove,
  removeLabel,
}: ImageUploadProps) => {
  const { t } = useTranslation(["common", "errors"])
  const id = useId()
  const { selection, error: validationError, select, clear } = useImageSelection()
  const previewUrl = selection?.url ?? currentUrl
  const clearSelection = () => {
    clear()
    onSelectionChange?.(false)
  }
  return (
    <form
      className="space-y-4"
      aria-label={label}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault()
        if (selection && !pending && !disabled) onUpload(selection.file, clearSelection)
      }}
    >
      <div
        className={cn("flex gap-4", avatar ? "flex-col sm:flex-row sm:items-start" : "flex-col")}
      >
        {(avatar || previewUrl) && (
          <ImagePreview
            key={previewUrl}
            src={previewUrl}
            alt={label}
            fallback={
              fallback ?? (
                <span className="p-4 text-sm text-muted-foreground">
                  {t("common:image.unavailable")}
                </span>
              )
            }
            className={
              avatar
                ? "size-20 rounded-full text-xl font-semibold text-primary"
                : "aspect-video w-full max-w-lg rounded-lg border"
            }
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            type="file"
            accept={imageAccept}
            disabled={pending || disabled}
            aria-invalid={Boolean(validationError)}
            aria-describedby={`${id}-hint${validationError ? ` ${id}-error` : ""}`}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ""
              if (file) {
                onReset()
                const selected = select(file)
                onSelectionChange?.(selected)
              }
            }}
          />
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {t("common:image.hint")}
          </p>
          {validationError && (
            <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
              {t(`errors:${validationError}`)}
            </p>
          )}
          {selection && (
            <p className="text-sm wrap-anywhere text-muted-foreground">
              {t("common:image.selected", { name: selection.file.name })}
            </p>
          )}
        </div>
      </div>
      {selection && (
        <div className="flex flex-wrap gap-2">
          <SubmitButton pending={pending} disabled={disabled}>
            <Upload />
            {t("common:image.upload")}
          </SubmitButton>
          <Button
            type="button"
            variant="outline"
            disabled={pending || disabled}
            onClick={() => {
              clearSelection()
              onReset()
            }}
          >
            {t("common:actions.cancel")}
          </Button>
        </div>
      )}
      {!selection && currentUrl && onRemove && (
        <Button type="button" variant="outline" disabled={pending || disabled} onClick={onRemove}>
          <Trash2 />
          {removeLabel}
        </Button>
      )}
      {!avatar && !previewUrl && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImagePlus className="size-4" aria-hidden="true" />
          {t("common:image.empty")}
        </p>
      )}
      <MutationError error={error} />
    </form>
  )
}
