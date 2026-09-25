import type { ComponentProps } from "react"

import { useTranslation } from "react-i18next"

import { FormInput } from "@/components/ui/form-field"

type OtpInputProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string
  onChange: (value: string) => void
  error?: string
}

// A single native field preserves arrow keys, selection, backspace, paste and SMS/email autofill.
export const OtpInput = ({ value, onChange, error, ...props }: OtpInputProps) => {
  const { t } = useTranslation("auth")
  return (
    <FormInput
      {...props}
      id={props.id ?? "otp"}
      label={t("otp.label")}
      hint={t("otp.hint")}
      error={error}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      value={value}
      onChange={(event) => {
        if (/^[0-9]{0,6}$/.test(event.target.value)) onChange(event.target.value)
      }}
      onPaste={(event) => {
        const pasted = event.clipboardData.getData("text").trim()
        event.preventDefault()
        if (/^[0-9]{6}$/.test(pasted)) onChange(pasted)
      }}
    />
  )
}
