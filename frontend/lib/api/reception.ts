// lib/api/reception.ts
import { apiClient } from "./client";
import { Appointment, Patient } from "@/types";

export async function fetchTodayAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<{ data: Appointment[] }>("/appointments");
  return response.data.data;
}

export async function updateAppointmentStatus(
  id: string,
  status: "SCHEDULED" | "CHECKED_IN" | "DELAYED" | "COMPLETED" | "CANCELLED"
): Promise<Appointment> {
  return apiClient.put<Appointment>(`/appointments/${id}/status`, { status });
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const response = await apiClient.get<{ data: Patient[] }>("/patients", {
    params: { search: query },
  });
  return response.data.data;
}