export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  tokenType: "Bearer"
  expiresIn: number
}

export type LoginResult = {
  message: string
  tokens: LoginResponse
}
