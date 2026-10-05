import { useEffect, useState } from "react"

import { imageFileSchema } from "@/lib/image-file"

export const useImageSelection = () => {
  const [selection, setSelection] = useState<{ file: File; url: string } | null>(null)
  const [error, setError] = useState<"invalidImage" | "imageTooLarge" | null>(null)
  const url = selection?.url
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  const clear = () => {
    setSelection(null)
    setError(null)
  }
  const select = (file: File) => {
    const result = imageFileSchema.safeParse(file)
    if (!result.success) {
      setSelection(null)
      setError(
        result.error.issues[0].message === "imageTooLarge" ? "imageTooLarge" : "invalidImage",
      )
      return false
    }
    setError(null)
    setSelection({ file, url: URL.createObjectURL(file) })
    return true
  }
  return { selection, error, select, clear }
}
