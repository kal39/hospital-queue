"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  TrendingUp,
  Users,
  Calendar,
  Package,
  Activity,
  AlertTriangle,
  Info,
  Sparkles,
  Download,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Layers
} from "lucide-react";

// Types
interface QueueActivity {
  id: string;
  name: string;
  patientId: string;
  physician: string;
  physicianInitials: string;
  status: "In Progress" | "Waiting" | "Delayed";
  waitTime: string;
  isWarnTime?: boolean;
}

// Mock Data
const DATA_MAIN_CAMPUS = {
  totalDocs: 48,
  docsGrowth: "+ 2.4%",
  patients: "1,204",
  patientsGrowth: "+ 14%",
  todayAppointments: 156,
  lowStock: 8,
  staffEfficiency: "94%",
  chartData: [45, 60, 50, 75, 40, 30, 65, 55, 70, 80, 50, 95, 30, 20]
};

const DATA_NORTH_CLINIC = {
  totalDocs: 24,
  docsGrowth: "+ 1.1%",
  patients: "582",
  patientsGrowth: "+ 8%",
  todayAppointments: 72,
  lowStock: 2,
  staffEfficiency: "88%",
  chartData: [30, 45, 35, 55, 25, 20, 45, 35, 50, 60, 30, 70, 15, 10]
};

const INITIAL_ACTIVITY: QueueActivity[] = [
  {
    id: "1",
    name: "Alice Miller",
    patientId: "#PX-8291",
    physician: "Dr. Robert Chen",
    physicianInitials: "RC",
    status: "In Progress",
    waitTime: "14m"
  },
  {
    id: "2",
    name: "John Smith",
    patientId: "#PX-4421",
    physician: "Dr. Sarah Johnson",
    physicianInitials: "SJ",
    status: "Waiting",
    waitTime: "42m",
    isWarnTime: true
  },
  {
    id: "3",
    name: "David Kim",
    patientId: "#PX-9102",
    physician: "Dr. Emily White",
    physicianInitials: "EW",
    status: "Delayed",
    waitTime: "55m",
    isWarnTime: true
  }
];

// Helper to safely extract initials
const getInitials = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : "";
};

export default function AdminDashboardPage() {
  const [activeCampus, setActiveCampus] = useState<"main" | "north">("main");
  const [activity, setActivity] = useState<QueueActivity[]>(INITIAL_ACTIVITY);
  const [activityFilter, setActivityFilter] = useState<"All" | "In Progress" | "Waiting" | "Delayed">("All");
  
  const [waitTime, setWaitTime] = useState(12);
  const [isTriageDeployed, setIsTriageDeployed] = useState(false);

  const stats = activeCampus === "main" ? DATA_MAIN_CAMPUS : DATA_NORTH_CLINIC;

  const handleDeployTriage = () => {
    setIsTriageDeployed(true);
    setWaitTime(6);
    alert("Triage backup dispatched successfully. Wait times optimized to 6 mins.");
  };

  const filteredActivity = activityFilter === "All"
    ? activity
    : activity.filter(act => act.status === activityFilter);

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
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pl-1">Clinical Management</p>
          </div>

          <nav className="flex flex-col gap-1.5">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-blue-50/70 text-[#0046ad] transition-all">
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
            <Link href="/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all">
              <Users size={18} />
              User Management
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-400 border-t border-gray-100 pt-5 mb-2.5 uppercase tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live System Status
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-150 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-[#002b49] leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Central Command & Facility Metrics</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-[#f8faff] border border-gray-200 p-1 rounded-xl flex">
              <button
                onClick={() => setActiveCampus("main")}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                  activeCampus === "main"
                    ? "bg-white text-[#0046ad] shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Main Campus
              </button>
              <button
                onClick={() => setActiveCampus("north")}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                  activeCampus === "north"
                    ? "bg-white text-[#0046ad] shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                North Clinic
              </button>
            </div>

            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden border border-gray-200 flex items-center justify-center font-extrabold text-xs text-[#0046ad]">
              AD
            </div>
          </div>
        </header>

        {/* METRICS */}
        <div className="p-8 flex flex-col gap-8">
          
          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <Users size={18} />
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp size={10} />
                  {stats.docsGrowth}
                </span>
              </div>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Total Doctors</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalDocs}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <Users size={18} />
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp size={10} />
                  {stats.patientsGrowth}
                </span>
              </div>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Patients</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stats.patients}</p>
            </div>

            <div className="bg-[#003b95] text-white rounded-2xl p-5 shadow-md shadow-blue-900/10">
              <div className="flex items-center justify-between opacity-80 mb-3">
                <Calendar size={18} />
                <span className="text-[8px] bg-white/20 border border-white/10 font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
                  Busy Status
                </span>
              </div>
              <p className="text-[9px] font-bold opacity-75 uppercase tracking-wider">Today's Appointments</p>
              <p className="text-3xl font-black mt-1">{stats.todayAppointments}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-red-500 mb-3">
                <Package size={18} />
                <span className="text-[9px] font-extrabold text-red-600 tracking-wider">!</span>
              </div>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Low Stock</p>
              <p className="text-3xl font-black text-red-600 mt-1">0{stats.lowStock}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400 mb-3">
                <Activity size={18} />
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Optimal
                </span>
              </div>
              <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Staffing Efficiency</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stats.staffEfficiency}</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: stats.staffEfficiency }} />
              </div>
            </div>
          </div>

          {/* CHARTS & AI OPTIMIZER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#002b49]">Appointment Volume Analysis</h3>
                  <p className="text-[11px] text-gray-400 font-bold mt-0.5">Dynamic workload tracking (Last 14 Days)</p>
                </div>
                <div className="bg-[#f8faff] border border-gray-200 p-1 rounded-xl flex text-[10px] font-bold">
                  <button className="py-1 px-3 bg-white shadow-xs rounded-lg text-[#0046ad]">vs Last Month</button>
                  <button className="py-1 px-3 text-gray-500 hover:text-gray-900">vs Average</button>
                </div>
              </div>

              <div className="h-60 flex items-end gap-3.5 pt-6 px-2 border-b border-gray-100">
                {stats.chartData.map((val, idx) => {
                  const isToday = idx === 11;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute top-0 transform -translate-y-6 bg-[#002b49] text-white text-[9px] py-0.5 px-1.5 rounded-md font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {val} Appts
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? "bg-[#004197] shadow-lg shadow-blue-500/10"
                            : "bg-blue-100/70 hover:bg-blue-200"
                        }`}
                        style={{ height: `${val}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between px-2 text-[10px] font-bold text-gray-400 mt-3.5 uppercase tracking-wide">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                <span>M</span><span>T</span><span>W</span><span>T</span><span className="text-[#0046ad] font-black">Today</span><span>S</span><span>S</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Critical Alerts</h3>
                  <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black px-2 py-0.5 rounded-md tracking-wide uppercase">
                    2 New
                  </span>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div className="bg-red-50/30 border border-red-100/60 p-3.5 rounded-2xl flex gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-900 leading-tight">Low Inventory: Insulin</h4>
                      <p className="text-[10px] text-red-500 font-semibold mt-1">Central pharmacy stock below 5% threshold.</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/30 border border-blue-100/60 p-3.5 rounded-2xl flex gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#0046ad] flex-shrink-0">
                      <Info size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 leading-tight">Schedule Update</h4>
                      <p className="text-[10px] text-blue-500 font-semibold mt-1">Dr. Sarah Johnson added 4 shifts next week.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#003b95] text-white rounded-3xl p-5 shadow-md flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-sky-300" />
                  <h3 className="text-xs font-black tracking-widest uppercase text-sky-300">AI Optimizer</h3>
                </div>

                {isTriageDeployed ? (
                  <div className="flex flex-col gap-2 pt-2 pb-1.5">
                    <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Triage-C Deployed
                    </p>
                    <p className="text-xs text-blue-100/80 leading-relaxed font-semibold">
                      Triage team deployed successfully. Wait times optimized down to <span className="font-extrabold text-white">{waitTime} mins</span>.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-blue-50/90 font-semibold leading-relaxed">
                      Wait times are currently up <span className="font-extrabold text-white">{waitTime} mins</span>. We recommend deploying additional triage staff to Triage-C immediately.
                    </p>
                    <button
                      onClick={handleDeployTriage}
                      className="w-full bg-white hover:bg-gray-50 text-[#004197] py-2.5 px-4 rounded-xl font-bold text-xs transition-colors mt-2"
                    >
                      Deploy Triage Staff
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY TABLE */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-md font-bold text-[#002b49]">Recent Queue Activity</h3>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Live patient journey tracking</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 py-1.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5">
                  <Download size={14} />
                  Export CSV
                </button>
                <div className="relative">
                  <button className="bg-[#004197] hover:bg-[#00347a] text-white py-1.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors">
                    <Filter size={14} />
                    Filter
                  </button>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#f8faff]/50">
                    <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Patient Name</th>
                    <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Attending Physician</th>
                    <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Status</th>
                    <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Wait Time</th>
                    <th className="py-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map((act) => (
                    <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-extrabold text-xs text-[#0046ad]">
                            {getInitials(act.name)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-[#0046ad]">{act.name}</h4>
                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">ID: {act.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#f8faff] border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {act.physicianInitials}
                          </div>
                          <span className="text-xs font-bold text-gray-700">{act.physician}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          act.status === "In Progress" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          act.status === "Waiting" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${act.isWarnTime ? "text-red-500 font-extrabold" : "text-gray-700"}`}>
                          {act.isWarnTime && <AlertTriangle size={13} className="text-red-500 animate-pulse" />}
                          {act.waitTime}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors">
                            View Record
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-[#f8faff]/50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Showing {filteredActivity.length} of {activity.length} patients</span>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                  <ChevronLeft size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}