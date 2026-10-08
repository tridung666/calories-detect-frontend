import { imageFileSchema, imageSourceSchema, maxImageBytes } from "@/lib/image-file"

const targetImageBytes = 2 * 1024 * 1024
const maxImageDimension = 2048

export type ImagePreparationErrorKey = "invalidImage" | "imageTooLarge" | "imageProcessingFailed"

export class ImagePreparationError extends Error {
  readonly key: ImagePreparationErrorKey

  constructor(key: ImagePreparationErrorKey) {
    super(key)
    this.key = key
  }
}

const encodeJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob?.size && blob.type === "image/jpeg") resolve(blob)
        else reject(new ImagePreparationError("imageProcessingFailed"))
      },
      "image/jpeg",
      quality,
    )
  })

const loadImage = (url: string, signal: AbortSignal) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const cleanup = () => {
      image.onload = null
      image.onerror = null
      signal.removeEventListener("abort", abort)
    }
    const abort = () => {
      cleanup()
      image.removeAttribute("src")
      reject(new DOMException("Image preparation cancelled", "AbortError"))
    }
    image.onload = () => {
      cleanup()
      resolve(image)
    }
    image.onerror = () => {
      cleanup()
      reject(new ImagePreparationError("invalidImage"))
    }
    signal.addEventListener("abort", abort, { once: true })
    if (signal.aborted) abort()
    else image.src = url
  })

export const prepareImageForUpload = async (
  file: File,
  signal: AbortSignal = new AbortController().signal,
): Promise<File> => {
  if (!imageSourceSchema.safeParse(file).success) throw new ImagePreparationError("invalidImage")
  signal.throwIfAborted()
  const url = URL.createObjectURL(file)
  let image: HTMLImageElement | undefined
  let canvas: HTMLCanvasElement | undefined
  try {
    // The browser applies EXIF orientation when loading phone photos.
    image = await loadImage(url, signal)
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
    if (!longestSide) throw new ImagePreparationError("invalidImage")
    if (file.size <= targetImageBytes && longestSide <= maxImageDimension) return file

    canvas = document.createElement("canvas")
    const scale = Math.min(1, maxImageDimension / longestSide)
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new ImagePreparationError("imageProcessingFailed")

    let blob: Blob | undefined
    // Bound the work on mobile; reduce dimensions if quality alone is insufficient.
    for (let attempt = 0; attempt < 4; attempt++) {
      signal.throwIfAborted()
      context.fillStyle = "#fff"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.85, 0.7, 0.55]) {
        signal.throwIfAborted()
        blob = await encodeJpeg(canvas, quality)
        signal.throwIfAborted()
        if (blob.size <= targetImageBytes) break
      }
      if (blob && blob.size <= targetImageBytes) break
      if (attempt < 3) {
        canvas.width = Math.max(1, Math.floor(canvas.width * 0.75))
        canvas.height = Math.max(1, Math.floor(canvas.height * 0.75))
      }
    }
    if (!blob || blob.size > maxImageBytes) throw new ImagePreparationError("imageTooLarge")
    // Preserve an already valid original when re-encoding would make it larger.
    if (
      longestSide <= maxImageDimension &&
      file.size <= blob.size &&
      imageFileSchema.safeParse(file).success
    )
      return file
    const name = file.name.replace(/\.[^.]+$/, "") || "image"
    const prepared = new File([blob], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    })
    if (!imageFileSchema.safeParse(prepared).success)
      throw new ImagePreparationError("imageTooLarge")
    return prepared
  } finally {
    URL.revokeObjectURL(url)
    image?.removeAttribute("src")
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
