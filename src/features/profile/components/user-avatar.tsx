import { ImagePreview } from "@/components/ui/image-preview"
import { getInitials } from "@/lib/format"

export const UserAvatar = ({ name, url }: { name: string; url?: string | null }) => (
  <ImagePreview
    key={url}
    src={url}
    alt=""
    fallback={getInitials(name)}
    className="size-9 rounded-lg border text-xs font-semibold"
  />
)
