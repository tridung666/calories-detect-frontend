import { useEffect, useRef, useState } from "react"

import { useMutation } from "@tanstack/react-query"

import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/api-error"

// Drop mutation variables immediately after each request, including on unmount.
// UI errors retain only a message/code, never Axios's request body or credentials.
export const usePasswordAction = <T>(api: (values: T) => Promise<string>) => {
  const mutation = useMutation({ mutationFn: api, gcTime: 0, retry: false })
  const busy = useRef(false)
  const mounted = useRef(true)
  const [error, setError] = useState<{ code?: number; message: string } | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = async (
    values: T,
    onError?: (error: unknown) => void,
    onSuccess?: (active: boolean) => void,
  ) => {
    if (busy.current || !mounted.current) return false
    busy.current = true
    setError(null)
    try {
      await mutation.mutateAsync(values)
      onSuccess?.(mounted.current)
      return mounted.current
    } catch (error) {
      if (mounted.current) {
        setError({ code: getApiErrorCode(error), message: getApiErrorMessage(error) })
        onError?.(error)
      }
      return false
    } finally {
      busy.current = false
      mutation.reset()
    }
  }
  return { run, pending: mutation.isPending, error, clearError: () => setError(null) }
}
