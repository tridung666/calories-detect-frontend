import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "@/hooks/useTheme"

export function AppToaster() {
  const { theme } = useTheme()

  return (
    <Toaster
      offset="72px"
      position="top-right"
      richColors
      theme={theme}
    />
  )
}
