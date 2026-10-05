export type User = {
  id: number
  email: string
  fullName: string
  avatarUrl?: string | null
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}
