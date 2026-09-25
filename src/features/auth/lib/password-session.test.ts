import { QueryClient } from "@tanstack/react-query"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

import { clearPasswordResetSession } from "@/features/auth/lib/password-session"
import { tokenStorage } from "@/lib/api/token-storage"

beforeEach(() => {
  const storage = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
  vi.stubGlobal("window", new EventTarget())
  tokenStorage.setAccessToken(
    `test.${btoa(JSON.stringify({ userId: 1, sub: "user@example.com", role: "USER", exp: 9999999999 }))}.signature`,
  )
})
afterEach(() => vi.unstubAllGlobals())

it.each([undefined, 1])(
  "clears all account queries, mutations and tokens after a matching reset (%s)",
  (userId) => {
    const client = new QueryClient()
    client.setQueryData(["profile", 1], { email: "user@example.com" })
    client.setQueryData(["meals"], [{ id: 1 }])
    client.getMutationCache().build(client, { mutationKey: ["old-account"] })
    clearPasswordResetSession(client, " USER@example.com ", userId)
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(client.getMutationCache().getAll()).toHaveLength(0)
  },
)
it("matches the current profile email when the token subject is not an email", () => {
  const client = new QueryClient()
  client.setQueryData(["profile", 1], { email: "current@example.com" })
  clearPasswordResetSession(client, "current@example.com")
  expect(tokenStorage.getAccessToken()).toBeNull()
})
it.each([undefined, 2])("preserves another account and its cache (%s)", (userId) => {
  const client = new QueryClient()
  client.setQueryData(["profile", 1], { email: "user@example.com" })
  clearPasswordResetSession(client, "other@example.com", userId)
  expect(tokenStorage.getAccessToken()).not.toBeNull()
  expect(client.getQueryData(["profile", 1])).toBeDefined()
  client.clear()
})
