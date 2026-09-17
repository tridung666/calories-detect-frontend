import { AxiosError, AxiosHeaders } from "axios"
import { createInstance } from "i18next"
import { afterEach, describe, expect, it, vi } from "vitest"

import { loginSchema } from "@/features/auth/schemas/login-schema"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { formatDate, formatNumber } from "@/lib/format"
import {
  detectLanguage,
  getInitialLanguage,
  persistLanguage,
  supportedLanguages,
} from "@/lib/i18n/config"
import { i18n } from "@/lib/i18n/i18n"
import { resources } from "@/lib/i18n/resources"
import { getValidationMessage } from "@/lib/i18n/validation"

afterEach(async () => {
  vi.unstubAllGlobals()
  await i18n.changeLanguage("vi")
})

describe("language selection", () => {
  it.each([
    ["vi", ["en-US"], "vi"],
    ["en", ["vi-VN"], "en"],
    [null, ["fr-FR", "en-GB"], "en"],
    ["unknown", ["vi-VN"], "vi"],
    [null, ["en_US"], "en"],
    [null, ["fr-FR"], "vi"],
    [null, [], "vi"],
  ])("resolves stored %s and browser %j to %s", (stored, browser, expected) => {
    expect(detectLanguage(stored, browser)).toBe(expected)
  })

  it("keeps language switching available when browser storage is blocked", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("Storage blocked")
      },
    })
    vi.stubGlobal("navigator", { languages: ["en-US"] })
    expect(getInitialLanguage()).toBe("en")
    expect(() => persistLanguage("vi")).not.toThrow()
  })
})

describe("localized content", () => {
  it("uses the correct plural forms and interpolates names", () => {
    const en = i18n.getFixedT("en", ["meals", "dashboard"])
    const vi = i18n.getFixedT("vi", "meals")
    expect(en("count", { count: 0 })).toBe("0 meals")
    expect(en("count", { count: 1 })).toBe("1 meal")
    expect(en("count", { count: 2 })).toBe("2 meals")
    expect(vi("count", { count: 1 })).toBe("1 bữa ăn")
    expect(en("dashboard:greeting", { name: "Anh" })).toBe("Hi Anh, how are you today?")
  })

  it("falls back to English when a translation is unavailable", async () => {
    const isolated = createInstance()
    await isolated.init({
      lng: "vi",
      fallbackLng: "en",
      defaultNS: "common",
      resources: {
        en: { common: resources.en.common },
        vi: { common: { brand: { name: "Calories Detect" } } },
      },
    })
    expect(isolated.t("brand.tagline")).toBe(resources.en.common.brand.tagline)
  })

  it("translates the same validation issue without rebuilding the schema", () => {
    const result = loginSchema.safeParse({ email: "", password: "" })
    expect(result.success).toBe(false)
    const message = result.error!.issues[0].message
    expect(getValidationMessage(message, i18n.getFixedT("vi", "validation"))).toBe(
      "Vui lòng nhập email",
    )
    expect(getValidationMessage(message, i18n.getFixedT("en", "validation"))).toBe(
      "Please enter your email",
    )
    expect(getValidationMessage("Unknown Zod issue", i18n.getFixedT("en", "validation"))).toBe(
      "Please enter a valid value",
    )
  })

  it("formats numbers and local calendar dates in the active language", async () => {
    await i18n.changeLanguage("vi")
    expect(formatNumber(1234.5)).toBe("1.234,5")
    expect(formatDate("2026-09-12")).toBe("12/09/2026")
    await i18n.changeLanguage("en")
    expect(formatNumber(1234.5)).toBe("1,234.5")
    expect(formatDate("2026-09-12")).toBe("09/12/2026")
    expect(formatDate(null)).toBe("—")
    expect(formatDate("invalid")).toBe("—")
  })

  it("translates an existing API error using the currently selected language", async () => {
    const config = { headers: new AxiosHeaders() }
    const error = new AxiosError("Failure", "ERR_BAD_REQUEST", config, undefined, {
      config,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      data: { code: 11001, message: "Untranslated backend message" },
    })
    await i18n.changeLanguage("vi")
    expect(getApiErrorMessage(error)).toBe("Email hoặc mật khẩu chưa chính xác.")
    await i18n.changeLanguage("en")
    expect(getApiErrorMessage(error)).toBe("Email or password is incorrect.")
    expect(getApiErrorMessage(new AxiosError("Offline"))).toBe("Unable to connect to the server.")
    expect(getApiErrorMessage(new Error("Internal details"))).toBe(
      "Something went wrong. Please try again.",
    )
  })
})

type Catalog = { [key: string]: string | Catalog }
const flatten = (catalog: Catalog, prefix = ""): Record<string, string> =>
  Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof value === "string" ? [[path, value]] : Object.entries(flatten(value, path))
    }),
  )
const variables = (value: string) =>
  [...value.matchAll(/{{\s*([^},]+)(?:,[^}]*)?}}/g)].map((match) => match[1]).sort()

it.each(supportedLanguages)("keeps %s translation keys and placeholders complete", (language) => {
  const reference = flatten(resources.en)
  const catalog = flatten(resources[language])
  for (const [key, value] of Object.entries(reference)) {
    expect(catalog[key], `${language}:${key}`).toBeTruthy()
    expect(variables(catalog[key]), `${language}:${key}`).toEqual(variables(value))
  }
})
