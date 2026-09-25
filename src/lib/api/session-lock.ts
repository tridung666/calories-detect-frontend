// All cookie mutations share a lock, including logout after an in-flight rotation.
export const withSessionLock = <T>(action: () => Promise<T>): Promise<T> =>
  typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request("calories-detect:session-cookie", action)
    : action()
