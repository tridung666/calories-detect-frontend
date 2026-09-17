import { useState, type ComponentProps, type ReactNode } from "react"

import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { getValidationMessage } from "@/lib/i18n/validation"

type FieldProps = { id: string; label: string; error?: string; hint?: string }

const Field = ({ id, label, error, hint, children }: FieldProps & { children: ReactNode }) => {
  const { t } = useTranslation("validation")
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p className="text-xs leading-relaxed text-muted-foreground" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" id={`${id}-error`} role="alert">
          {getValidationMessage(error, t)}
        </p>
      )}
    </div>
  )
}

const describedBy = ({ id, error, hint }: FieldProps) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined

export const FormInput = ({
  label,
  error,
  hint,
  id,
  type,
  ...props
}: FieldProps & ComponentProps<"input">) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const field = { label, error, hint, id }
  return (
    <Field {...field}>
      <div className="relative">
        <Input
          {...props}
          id={id}
          className={type === "password" ? "h-10 pr-12" : "h-10"}
          type={type === "password" && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(field)}
        />
        {type === "password" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1"
            aria-label={t(visible ? "fields.hidePassword" : "fields.showPassword", {
              label: label.toLocaleLowerCase(),
            })}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
    </Field>
  )
}

export const FormSelect = ({
  label,
  error,
  hint,
  id,
  children,
  ...props
}: FieldProps & ComponentProps<typeof NativeSelect>) => {
  const field = { label, error, hint, id }
  return (
    <Field {...field}>
      <NativeSelect
        {...props}
        id={id}
        className="w-full [&_select]:h-10"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(field)}
      >
        {children}
      </NativeSelect>
    </Field>
  )
}
