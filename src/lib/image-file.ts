import { z } from "zod"

export const imageAccept = "image/jpeg,image/png,image/webp"
export const maxImageBytes = 5 * 1024 * 1024

export const imageFileSchema = z
  .file()
  .min(1, "invalidImage")
  .max(maxImageBytes, "imageTooLarge")
  .mime(imageAccept.split(","), "invalidImage")
