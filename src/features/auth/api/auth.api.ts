import { api } from "@/shared/api/axios";

import type {
    RegisterRequest,
    RegisterResponse,
} from "../types/auth.types";

export async function register(
    data: RegisterRequest,
): Promise<RegisterResponse> {

    const response = await api.post<RegisterResponse>(
        "/auth/register",
        data,
    );

    return response.data;
}