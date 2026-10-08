import { z } from "zod"

export const imageAccept = "image/jpeg,image/png,image/webp"
export const maxImageBytes = 10 * 1024 * 1024

// Validate the source without rejecting large photos before they can be compressed.
export const imageSourceSchema = z
  .file()
  .min(1, "invalidImage")
  .mime(imageAccept.split(","), "invalidImage")

export const imageFileSchema = imageSourceSchema.max(maxImageBytes, "imageTooLarge")
