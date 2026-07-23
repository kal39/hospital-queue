// lib/api/auth.ts
import { apiClient } from "./client";
import { User } from "@/types";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export async function loginUser(identifier: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<{ data: AuthResponse }>("/auth/login", {
    identifier,
    password,
  });
  return response.data.data;
}

export async function registerPatient(data: {
  email?: string;
  phone?: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender: string;
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
}): Promise<AuthResponse> {
  const response = await apiClient.post<{ data: AuthResponse }>("/auth/register", data);
  return response.data.data;
}

export async function fetchMe(): Promise<User> {
  const response = await apiClient.get<{ data: User }>("/auth/me");
  return response.data.data;
}