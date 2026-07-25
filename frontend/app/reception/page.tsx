// app/reception/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { 
  Search, 
  Calendar, 
  UserCheck, 
  Clock, 
  User, 
  CheckCircle2, 
  Users, 
  Building2,
  RefreshCw
} from "lucide-react";

// API Helpers
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api/v1";

const fetchPatients = async (searchTerm: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.get(`${getBaseUrl()}/patients`, {
    params: { search: searchTerm },
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data?.data || res.data || [];
};

const fetchTodayAppointments = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.get(`${getBaseUrl()}/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data?.data || res.data || [];
};

const checkInPatient = async (appointmentId: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.put(
    `${getBaseUrl()}/appointments/${appointmentId}/status`,
    { status: "checked_in" },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export default function ReceptionPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [patientSearch, setPatientSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"appointments" | "patients">("appointments");

  // 1. Fetch Patients List (GET /patients)
  const { data: patients = [], isLoading: loadingPatients, refetch: refetchPatients } = useQuery({
    queryKey: ["patients", patientSearch],
    queryFn: () => fetchPatients(patientSearch),
  });

  // 2. Fetch Today's Appointments List
  const { data: appointments = [], isLoading: loadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: fetchTodayAppointments,
  });

  // 3. Check-In Patient Mutation (PUT /appointments/:id/status → checked_in)
  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) => checkInPatient(appointmentId),
    onSuccess: () => {
      alert("Patient successfully checked in!");
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
    },
    onError: (err: any) => {
      alert(`Check-in failed: ${err.response?.data?.message || err.message}`);
    }
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans pb-16 select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0046ad] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Building2 size={20} />
          </div>
          <div>
            <span className="text-lg font-bold text-[#002b49] block leading-tight">Front-Desk Reception</span>
            <span className="text-xs text-gray-500 font-semibold">Hospital Queue Management System</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { refetchAppointments(); refetchPatients(); }}
            className="p-2 text-gray-500 hover:text-[#0046ad] bg-gray-100 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0046ad]">
            {user?.firstName ? user.firstName[0].toUpperCase() : "R"}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* TOP BAR / NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002b49]">Reception Operations</h1>
            <p className="text-gray-500 text-xs font-semibold mt-1">
              Manage patient check-ins, view today's schedule, and search patient records.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "appointments"
                  ? "bg-[#0046ad] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Calendar size={15} />
              Today's Appointments
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "patients"
                  ? "bg-[#0046ad] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Users size={15} />
              Patient Directory
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <Search size={20} className="text-gray-400 ml-1" />
          <input
            type="text"
            placeholder="Search patients by name, email, or phone number..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400"
          />
        </div>

        {/* TAB 1: TODAY'S APPOINTMENTS & CHECK-IN */}
        {activeTab === "appointments" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#002b49] flex items-center gap-2">
                <Clock className="text-[#0046ad]" size={18} />
                Today's Scheduled Appointments
              </h3>
              <span className="text-xs font-bold text-[#0046ad] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {appointments.length} Appointments Total
              </span>
            </div>

            {loadingAppointments ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">Loading today's schedule...</div>
            ) : appointments.length > 0 ? (
              <div className="flex flex-col gap-3">
                {appointments.map((appt: any) => {
                  const status = String(appt.status || "").toLowerCase();
                  const isCheckedIn = status === "checked_in" || status === "checkedin";

                  return (
                    <div
                      key={appt.id}
                      className="p-4 rounded-2xl border border-gray-150 hover:border-gray-250 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0046ad] flex items-center justify-center font-bold text-sm">
                          <User size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">
                            {appt.patientName || (appt.user ? `${appt.user.firstName} ${appt.user.lastName}` : "Patient")}
                          </h4>
                          <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mt-0.5">
                            <span>Doctor: <strong className="text-gray-700">Dr. {appt.doctorName || "Staff"}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {appt.time || "Scheduled"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {isCheckedIn ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            Checked In
                          </span>
                        ) : (
                          <button
                            onClick={() => checkInMutation.mutate(appt.id)}
                            disabled={checkInMutation.isPending}
                            className="px-4 py-2 bg-[#0046ad] hover:bg-[#00347a] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            <UserCheck size={15} />
                            {checkInMutation.isPending ? "Checking in..." : "Check In Patient"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-semibold text-gray-400">
                No appointments found for today.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PATIENT DIRECTORY */}
        {activeTab === "patients" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#002b49] flex items-center gap-2">
                <Users className="text-[#0046ad]" size={18} />
                Patient Directory (GET /patients)
              </h3>
              <span className="text-xs font-bold text-gray-500">
                Showing {patients.length} patients
              </span>
            </div>

            {loadingPatients ? (
              <div className="py-12 text-center text-[#0046ad] font-bold">Loading patient records...</div>
            ) : patients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient: any) => (
                  <div
                    key={patient.id}
                    className="p-4 rounded-2xl border border-gray-150 bg-[#f8faff]/50 flex items-start gap-3 hover:border-blue-300 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0046ad] flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {patient.firstName ? patient.firstName[0].toUpperCase() : "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-gray-900 truncate">
                        {patient.firstName} {patient.lastName}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{patient.email || "No email"}</p>
                      <p className="text-xs text-[#0046ad] font-bold mt-1">{patient.phone || "No phone"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-semibold text-gray-400">
                No patient records found matching your search.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}