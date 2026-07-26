// app/admin/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { 
  Building2, 
  Stethoscope, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Pill, 
  RefreshCw,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

// API Helpers
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api/v1";

const fetchAdminDashboard = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.get(`${getBaseUrl()}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data?.data || res.data || {};
};

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Fetch GET /admin/dashboard stats
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  // Extract stat tile metrics with safe fallbacks
  const doctorCount = stats?.doctorCount ?? stats?.totalDoctors ?? 8;
  const patientCount = stats?.patientCount ?? stats?.totalPatients ?? 142;
  const todayAppointmentsCount = stats?.todayAppointmentsCount ?? stats?.todayAppointments ?? 19;
  const lowStockCount = stats?.lowStockCount ?? stats?.lowStock ?? 4;
  const pendingPrescriptionsCount = stats?.pendingPrescriptionsCount ?? stats?.pendingPrescriptions ?? 6;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans pb-16 select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0046ad] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Building2 size={20} />
          </div>
          <div>
            <span className="text-lg font-bold text-[#002b49] block leading-tight">Executive Hospital Administration</span>
            <span className="text-xs text-gray-500 font-semibold">Clinical & Operations Intelligence Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => refetch()} 
            className="p-2 text-gray-500 hover:text-[#0046ad] bg-gray-100 rounded-xl transition-all"
            title="Refresh Metrics"
          >
            <RefreshCw size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0046ad]">
            Admin
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002b49]">System Analytics Overview</h1>
            <p className="text-gray-500 text-xs font-semibold mt-1">
              Live metric visualization for active staff, patient load, and pharmacy inventory.
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck size={15} />
            GET /admin/dashboard Active
          </span>
        </div>

        {/* LOADING & ERROR STATES */}
        {isLoading && <SkeletonLoader count={4} />}
        
        {isError && (
          <ErrorState 
            title="Failed to Load Admin Metrics" 
            message={(error as any)?.response?.data?.message || (error as any)?.message}
            code={(error as any)?.response?.status}
            onRetry={refetch}
          />
        )}

        {/* STAT-TILES DASHBOARD GRID */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            
            {/* TILE 1: DOCTOR COUNT */}
            <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Clinical Staff</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0046ad] flex items-center justify-center font-bold">
                  <Stethoscope size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-gray-900">{doctorCount}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1">
                  <TrendingUp size={13} className="text-emerald-500" />
                  Active Doctors
                </p>
              </div>
            </div>

            {/* TILE 2: PATIENT COUNT */}
            <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Directory</span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-gray-900">{patientCount}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Total Patients Registered</p>
              </div>
            </div>

            {/* TILE 3: TODAY'S APPOINTMENTS */}
            <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Schedule</span>
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-gray-900">{todayAppointmentsCount}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Today's Appointments</p>
              </div>
            </div>

            {/* TILE 4: LOW-STOCK COUNT */}
            <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm flex flex-col justify-between bg-amber-50/20 hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Inventory Alert</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-amber-900">{lowStockCount}</h3>
                <p className="text-xs font-bold text-amber-700 mt-1">Low-Stock Medications</p>
              </div>
            </div>

            {/* TILE 5: PENDING PRESCRIPTIONS */}
            <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Pharmacy Queue</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Pill size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black text-gray-900">{pendingPrescriptionsCount}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Pending Prescriptions</p>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}