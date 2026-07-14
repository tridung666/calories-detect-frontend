import type { BaseResponse } from "@/shared/types/api.types";

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export type RegisterResponse = BaseResponse<RegisteredUser>;

export interface RegisteredUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
}
