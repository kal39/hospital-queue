import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type AuthResponse = {
  user: User;
  tokens: TokenPair;
};

export async function registerPatient(input: {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
}) {
  const { data } = await apiClient.post<{ data: AuthResponse }>("/auth/register", input);
  return data.data;
}

export async function login(identifier: string, password: string) {
  const { data } = await apiClient.post<{ data: AuthResponse }>("/auth/login", {
    identifier,
    password,
  });
  return data.data;
}

export async function me() {
  const { data } = await apiClient.get<{ data: User }>("/auth/me");
  return data.data;
}

export function storeTokens(tokens: TokenPair) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
