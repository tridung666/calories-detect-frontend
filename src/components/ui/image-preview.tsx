import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export const ImagePreview = ({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string | null
  alt: string
  fallback: ReactNode
  className?: string
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted",
        className,
      )}
    >
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        fallback
      )}
    </div>
  )
}
