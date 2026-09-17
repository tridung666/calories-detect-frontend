type GoogleIdentity = {
  initialize: (options: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select: boolean
  }) => void
  renderButton: (
    element: HTMLElement,
    options: { theme: string; size: string; text: string; locale: string },
  ) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

let pendingScript: Promise<GoogleIdentity> | null = null

export const loadGoogleIdentity = (): Promise<GoogleIdentity> => {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id)
  if (pendingScript) return pendingScript
  pendingScript = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    const timeout = window.setTimeout(() => {
      script.remove()
      reject(new Error("Google không phản hồi"))
    }, 15_000)
    script.onload = () => {
      window.clearTimeout(timeout)
      if (window.google?.accounts.id) resolve(window.google.accounts.id)
      else reject(new Error("Không thể khởi tạo Google"))
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      script.remove()
      reject(new Error("Không thể kết nối Google"))
    }
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    pendingScript = null
    throw error
  })
  return pendingScript
}
