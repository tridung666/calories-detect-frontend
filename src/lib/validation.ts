import { z } from "zod"

import { validationKey } from "@/lib/i18n/validation"

export const emailSchema = z
  .string()
  .trim()
  .min(1, validationKey("emailRequired"))
  .email(validationKey("emailInvalid"))
  .max(255, validationKey("emailMax"))

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, validationKey("nameMin"))
  .max(255, validationKey("nameMax"))

export const passwordSchema = z
  .string()
  .min(8, validationKey("passwordMin"))
  .refine((value) => value.trim().length > 0, validationKey("passwordBlank"))
  .max(72, validationKey("passwordMax"))
  .refine((value) => new TextEncoder().encode(value).length <= 72, validationKey("passwordBytes"))

export const dateSchema = z.iso.date(validationKey("dateInvalid"))

export const nonNegativeIntegerSchema = z
  .number({ error: validationKey("numberInvalid") })
  .int(validationKey("integerRequired"))
  .min(0, validationKey("nonNegative"))
  .max(2_147_483_647, validationKey("numberMax"))

export const hasTwoDecimalPlaces = (value: number) =>
  Math.abs(value - Math.round(value * 100) / 100) <= Number.EPSILON * Math.max(1, Math.abs(value))

export const nutritionValueSchema = z
  .number({ error: validationKey("numberInvalid") })
  .min(0, validationKey("nonNegative"))
  .max(2_147_483_647, validationKey("numberMax"))
  .refine(hasTwoDecimalPlaces, validationKey("nutritionPrecision"))
