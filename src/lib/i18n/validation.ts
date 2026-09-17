import type { TFunction } from "i18next"

import messages from "@/locales/en/validation.json"

export type ValidationKey = keyof typeof messages

// Store keys in Zod issues so existing errors can be translated without resetting a form.
export const validationKey = (key: ValidationKey) => key

const isValidationKey = (value: string): value is ValidationKey => Object.hasOwn(messages, value)

export const getValidationMessage = (message: string, t: TFunction<"validation">) =>
  t(isValidationKey(message) ? message : "invalidValue")
