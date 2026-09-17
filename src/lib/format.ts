import { getLocale } from "@/lib/i18n/i18n"

export const formatNumber = (value: number, locale = getLocale()) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)

export const toDateInput = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")

// Date-only values belong to the user's local day, never to UTC midnight.
export const today = () => toDateInput(new Date())

export const formatDate = (value: string | null | undefined, locale = getLocale()) => {
  if (!value) return "—"
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
}

export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase(getLocale())
