import { afterEach, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

it("removes legacy tokens, stores access only in memory, and broadcasts no secrets", async () => {
  const local = new Map([
    ["accessToken", "legacy"],
    ["refreshToken", "secret"],
    ["calories-detect:tokens", "pair"],
  ])
  const session = new Map(local)
  const storage = (map: Map<string, string>) => ({
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
  })
  const windowMock = Object.assign(new EventTarget(), {
    localStorage: storage(local),
    sessionStorage: storage(session),
  })
  vi.stubGlobal("window", windowMock)
  vi.stubGlobal("localStorage", windowMock.localStorage)
  vi.stubGlobal("BroadcastChannel", undefined)
  const { tokenStorage } = await import("./token-storage")
  expect(local.size).toBe(0)
  expect(session.size).toBe(0)
  tokenStorage.setAccessToken("memory-only", { expiresIn: 60 })
  expect(local.size).toBe(0)
  expect(session.size).toBe(0)
  const listener = vi.fn()
  const unsubscribe = tokenStorage.subscribe(listener)
  const event = Object.assign(new Event("storage"), { key: "calories-detect:logout" })
  windowMock.dispatchEvent(event)
  expect(tokenStorage.getAccessToken()).toBeNull()
  expect(listener).toHaveBeenCalledOnce()
  tokenStorage.clearTokens()
  expect(local.size).toBe(1)
  expect([...local.values()].join()).not.toMatch(/secret|memory-only|legacy/)
  unsubscribe()
})

it("works when browser storage is blocked", async () => {
  const windowMock = new EventTarget()
  Object.defineProperty(windowMock, "localStorage", {
    get: () => {
      throw new Error("Blocked")
    },
  })
  vi.stubGlobal("window", windowMock)
  vi.stubGlobal("BroadcastChannel", undefined)
  const { tokenStorage } = await import("./token-storage")
  tokenStorage.setAccessToken("memory")
  expect(tokenStorage.getAccessToken()).toBe("memory")
  expect(() => tokenStorage.clearTokens()).not.toThrow()
})
