import { useEffect, useRef, useState } from "react"

import {
  ImagePreparationError,
  prepareImageForUpload,
  type ImagePreparationErrorKey,
} from "@/lib/prepare-image"

export const useImageSelection = () => {
  const [selection, setSelection] = useState<{ file: File; url: string } | null>(null)
  const [error, setError] = useState<ImagePreparationErrorKey | null>(null)
  const [processing, setProcessing] = useState(false)
  const preparation = useRef<AbortController | null>(null)
  useEffect(() => () => preparation.current?.abort(), [])
  const url = selection?.url
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  const clear = () => {
    preparation.current?.abort()
    preparation.current = null
    setProcessing(false)
    setSelection(null)
    setError(null)
  }
  const select = async (file: File) => {
    clear()
    const controller = new AbortController()
    preparation.current = controller
    setProcessing(true)
    try {
      const prepared = await prepareImageForUpload(file, controller.signal)
      if (controller.signal.aborted) return null
      setSelection({ file: prepared, url: URL.createObjectURL(prepared) })
      return true
    } catch (error) {
      if (controller.signal.aborted) return null
      setError(error instanceof ImagePreparationError ? error.key : "imageProcessingFailed")
      return false
    } finally {
      if (!controller.signal.aborted) {
        preparation.current = null
        setProcessing(false)
      }
    }
  }
  return { selection, error, processing, select, clear }
}
