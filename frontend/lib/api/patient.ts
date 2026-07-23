// lib/api/patient.ts
import { apiClient } from "./client";
import { Doctor, Appointment, Patient } from "@/types";

export async function fetchDoctors(): Promise<Doctor[]> {
  const response = await apiClient.get<{ data: Doctor[] }>("/doctors");
  return response.data.data;
}

export async function fetchAvailableSlots(doctorId: string, date: string): Promise<string[]> {
  const response = await apiClient.get<{ data: string[] }>(`/doctors/${doctorId}/slots`, {
    params: { date },
  });
  return response.data.data;
}

export async function bookAppointment(data: {
  doctorId: string;
  scheduledAt: string;
  reason?: string;
}): Promise<Appointment> {
  const response = await apiClient.post<{ data: Appointment }>("/patients/me/appointments", data);
  return response.data.data;
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<{ data: Appointment[] }>("/patients/me/appointments");
  return response.data.data;
}

export async function fetchMyProfile(): Promise<Patient> {
  const response = await apiClient.get<{ data: Patient }>("/patients/me");
  return response.data.data;
}

export async function updateMyProfile(data: Partial<Patient>): Promise<Patient> {
  const response = await apiClient.put<{ data: Patient }>("/patients/me", data);
  return response.data.data;
}