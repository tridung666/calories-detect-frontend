import enAdmin from "@/locales/en/admin.json"
import enAuth from "@/locales/en/auth.json"
import enCommon from "@/locales/en/common.json"
import enDashboard from "@/locales/en/dashboard.json"
import enErrors from "@/locales/en/errors.json"
import enMeals from "@/locales/en/meals.json"
import enProfile from "@/locales/en/profile.json"
import enValidation from "@/locales/en/validation.json"
import viAdmin from "@/locales/vi/admin.json"
import viAuth from "@/locales/vi/auth.json"
import viCommon from "@/locales/vi/common.json"
import viDashboard from "@/locales/vi/dashboard.json"
import viErrors from "@/locales/vi/errors.json"
import viMeals from "@/locales/vi/meals.json"
import viProfile from "@/locales/vi/profile.json"
import viValidation from "@/locales/vi/validation.json"
import type { Language } from "@/lib/i18n/config"

const en = {
  common: enCommon,
  auth: enAuth,
  meals: enMeals,
  dashboard: enDashboard,
  profile: enProfile,
  admin: enAdmin,
  validation: enValidation,
  errors: enErrors,
}

export const resources = {
  en,
  vi: {
    common: viCommon,
    auth: viAuth,
    meals: viMeals,
    dashboard: viDashboard,
    profile: viProfile,
    admin: viAdmin,
    validation: viValidation,
    errors: viErrors,
  },
} satisfies Record<Language, typeof en>
