import { toast } from "sonner"

export const notification = {
  success(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 3000,
    })
  },

  error(message: string, description?: string) {
    toast.error(message, {
      description,
      duration: 5000,
    })
  },
}