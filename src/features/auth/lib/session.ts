import { z } from "zod"

const sessionSchema = z.object({
  userId: z.number().int().positive(),
  sub: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  exp: z.number(),
})

// Claims identify the account; authorization remains enforced by the API.
export const readSession = (token: string | null) => {
  if (!token) return null
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0))
    const result = sessionSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export const getReturnTo = (search: string) => {
  const next = new URLSearchParams(search).get("next")
  return next?.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\") &&
    !next.startsWith("/auth")
    ? next
    : "/dashboard"
}
