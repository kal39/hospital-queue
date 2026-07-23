// app/reception/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTodayAppointments, updateAppointmentStatus, searchPatients } from "@/lib/api/reception";
import { useAuthStore } from "@/store/auth-store";
import {
  Bell,
  Search,
  Plus,
  RefreshCw,
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserPlus,
  FileText,
  CheckCircle,
  Volume2
} from "lucide-react";

export default function ReceptionDashboard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // 1. Fetch live appointments for today
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: fetchTodayAppointments,
    refetchInterval: 5000, // Poll every 5s for real-time front desk updates
  });

  // 2. Fetch live patient search results (only runs if search query is entered)
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ["patient-search", searchQuery],
    queryFn: () => searchPatients(searchQuery),
    enabled: searchQuery.length > 1,
  });

  // 3. Mutation to check in a patient (updates status on the backend)
  const checkInMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "CHECKED_IN" | "DELAYED" }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      alert("Patient successfully checked in! Live queue ticket created.");
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
    },
    onError: (err: any) => {
      alert(`Check-in failed: ${err.message}`);
    }
  });

  const handleCheckIn = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "DELAYED" ? "DELAYED" : "CHECKED_IN";
    checkInMutation.mutate({ id, status: nextStatus });
  };

  // Filter local appointments locally if search is empty, or show search query
  const displayedAppointments = searchQuery.length > 1
    ? appointments.filter(apt => apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
    : appointments;

  // Calculate live statistics
  const waitingCount = appointments.filter(a => a.status === "CHECKED_IN").length;
  const checkedInTotal = appointments.filter(a => a.status !== "SCHEDULED" && a.status !== "CANCELLED").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-[#002b49] font-sans relative select-none">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-white border-r border-gray-150 flex flex-col justify-between p-5 flex-shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 bg-[#0046ad] rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H10a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
                  <path d="M12 11v6" /><path d="M9 14h6" />
                </svg>
              </div>
              <span className="text-md font-bold text-[#002b49]">HospitalQueue</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pl-1">Central Clinic</p>
            <p className="text-[11px] font-semibold text-gray-500 pl-1 mt-0.5">Front Desk Wing A</p>
          </div>

          <nav className="flex flex-col gap-1.5">
            <Link href="/reception" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-blue-50/70 text-[#0046ad] transition-all">
              <LayoutDashboard size={18} />
              Overview
            </Link>
            <Link href="/live-queue" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all">
              <Layers size={18} />
              Live Queue
            </Link>
            <Link href="/appointments" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all">
              <Calendar size={18} />
              Appointments
            </Link>
            <Link href="/pharmacy" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l3-3m-3 3l3 3" />
              </svg>
              Pharmacy
            </Link>
          </nav>
        </div>

        <button className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/5">
          <Volume2 size={16} />
          Call Next Patient
        </button>
      </aside>

      {/* MAIN BODY */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white border-b border-gray-150 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-[#002b49] leading-tight">Reception Dashboard</h1>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Manage incoming patients and daily schedules</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-[280px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search today's patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-900"
              />
            </div>
          </div>
        </header>

        <div className="p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* STATS COLUMN (xl:col-span-4) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-4">Currently Serving</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#0046ad] font-bold text-base relative">
                  MC
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Live Queue Terminal</h4>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Active monitoring from front desk</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 p-4">
                <p className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">In Live Queue</p>
                <p className="text-3xl font-black text-[#0046ad] mt-1">{waitingCount}</p>
              </div>
              <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 p-4">
                <p className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Today Checked-In</p>
                <p className="text-3xl font-black text-[#002b49] mt-1">{checkedInTotal}</p>
              </div>
            </div>

          </div>

          {/* TODAY'S APPOINTMENTS TABLE CARD (xl:col-span-8) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-md font-bold text-[#002b49] flex items-center gap-2">
                  <Calendar size={18} className="text-[#0046ad]" />
                  Today's Appointments
                </h3>
              </div>

              {loadingAppointments ? (
                <div className="text-xs text-gray-400 font-semibold py-8 text-center">Loading today's schedule...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#f8faff]/50">
                        <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Time</th>
                        <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Patient Name</th>
                        <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Attending Doctor</th>
                        <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Status</th>
                        <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedAppointments.length > 0 ? (
                        displayedAppointments.map((apt) => {
                          const isScheduled = apt.status === "SCHEDULED" || apt.status === "DELAYED";
                          return (
                            <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-4.5 px-6 font-bold text-xs text-gray-900">{apt.time}</td>
                              <td className="py-4.5 px-6">
                                <h4 className="font-extrabold text-xs text-[#0046ad]">{apt.patientName}</h4>
                              </td>
                              <td className="py-4.5 px-6">
                                <h4 className="font-bold text-xs text-gray-800">Dr. {apt.doctorName}</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{apt.dept}</p>
                              </td>
                              <td className="py-4.5 px-6">
                                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  apt.status === "SCHEDULED" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                  apt.status === "CHECKED_IN" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                  apt.status === "DELAYED" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                  "bg-gray-100 text-gray-500"
                                }`}>
                                  {apt.status}
                                </span>
                              </td>
                              <td className="py-4.5 px-6 text-right">
                                {isScheduled ? (
                                  <button
                                    onClick={() => handleCheckIn(apt.id, apt.status)}
                                    disabled={checkInMutation.isPending}
                                    className="bg-[#004197] hover:bg-[#00347a] text-white py-1.5 px-4.5 rounded-lg font-bold text-[11px] tracking-wide transition-colors"
                                  >
                                    Check In
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="bg-blue-50 border border-blue-100 text-[#0046ad] py-1.5 px-4.5 rounded-lg font-bold text-[11px] cursor-not-allowed inline-flex items-center gap-1.5"
                                  >
                                    Verified
                                    <span>✓</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-xs font-semibold text-gray-400">
                            No appointments scheduled for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}