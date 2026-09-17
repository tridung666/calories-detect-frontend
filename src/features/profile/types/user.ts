export type User = {
  id: number
  email: string
  fullName: string
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}
