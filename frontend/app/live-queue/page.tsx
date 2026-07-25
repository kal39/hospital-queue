// app/live-queue/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { 
  Stethoscope, 
  Users, 
  UserCheck, 
  Pill, 
  RefreshCw,
  Send
} from "lucide-react";

// API Helpers
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api/v1";

const fetchDoctorQueue = async (doctorId: string) => {
  if (!doctorId) return [];
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.get(`${getBaseUrl()}/queue/doctor/${doctorId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data?.data || res.data || [];
};

const callNextPatientApi = async (doctorId: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.post(`${getBaseUrl()}/queue/call`, { doctorId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

const submitPrescriptionApi = async (data: { patientId: string; doctorId: string; medication: string; dosage: string; instructions: string }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.post(`${getBaseUrl()}/pharmacy/prescriptions`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export default function DoctorLiveQueuePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  
  const doctorId = user?.id || "doc-101";

  // State for prescription form
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");

  // 1. Fetch live queue for doctor's room (GET /queue/doctor/:doctorId)
  const { data: queue = [], isLoading: loadingQueue, refetch } = useQuery({
    queryKey: ["doctor-queue", doctorId],
    queryFn: () => fetchDoctorQueue(doctorId),
    enabled: !!doctorId,
  });

  // Active patient is the first item in queue
  const activeTicket = queue.find((q: any) => q.status === "CALLING" || q.status === "IN_PROGRESS") || queue[0];

  // 2. Call-Next Mutation
  const callNextMutation = useMutation({
    mutationFn: () => callNextPatientApi(doctorId),
    onSuccess: () => {
      alert("Called next patient to room!");
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] });
    },
    onError: (err: any) => {
      alert(`Call next failed: ${err.response?.data?.message || err.message}`);
    }
  });

  // 3. Submit Prescription Mutation (POST /pharmacy/prescriptions)
  const prescriptionMutation = useMutation({
    mutationFn: () => submitPrescriptionApi({
      patientId: activeTicket?.patientId || activeTicket?.userId || "patient-1",
      doctorId: doctorId,
      medication,
      dosage,
      instructions
    }),
    onSuccess: () => {
      alert("Prescription issued and sent to pharmacy!");
      setMedication("");
      setDosage("");
      setInstructions("");
    },
    onError: (err: any) => {
      alert(`Prescription failed: ${err.response?.data?.message || err.message}`);
    }
  });

  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication || !dosage) {
      alert("Please enter medication name and dosage.");
      return;
    }
    prescriptionMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans pb-16 select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0046ad] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Stethoscope size={20} />
          </div>
          <div>
            <span className="text-lg font-bold text-[#002b49] block leading-tight">Doctor Consultation Portal</span>
            <span className="text-xs text-gray-500 font-semibold">Live Room Queue & Clinical Prescriptions</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => refetch()} className="p-2 text-gray-500 hover:text-[#0046ad] bg-gray-100 rounded-xl transition-all" title="Refresh Queue">
            <RefreshCw size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0046ad]">
            Dr. {user?.lastName || "Staff"}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002b49]">Consultation Room Live Queue</h1>
            <p className="text-gray-500 text-xs font-semibold mt-1">
              Manage room calls and issue digital prescriptions to pharmacy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ROOM QUEUE & CALL NEXT BUTTON */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* CALL NEXT BANNER */}
            <div className="bg-[#0046ad] text-white p-6 rounded-3xl shadow-lg shadow-blue-500/10">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-200 block mb-1">
                Room Call Console
              </span>
              <h3 className="text-xl font-extrabold mb-4">Consultation Room Queue</h3>
              
              <button
                onClick={() => callNextMutation.mutate()}
                disabled={callNextMutation.isPending}
                className="w-full bg-white text-[#0046ad] hover:bg-blue-50 py-3.5 px-4 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <UserCheck size={18} />
                {callNextMutation.isPending ? "Calling Patient..." : "Call Next Patient"}
              </button>
            </div>

            {/* LIVE QUEUE LIST (GET /queue/doctor/:doctorId) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Users size={14} className="text-[#0046ad]" />
                  Waiting Room Queue (GET /queue/doctor/{doctorId})
                </h3>
                <span className="text-xs font-bold text-[#0046ad] bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {queue.length} Waiting
                </span>
              </div>

              {loadingQueue ? (
                <div className="py-8 text-center text-xs font-bold text-gray-400">Loading live queue...</div>
              ) : queue.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {queue.map((item: any, idx: number) => {
                    const isCalling = item.status === "CALLING" || item.status === "IN_PROGRESS";
                    return (
                      <div
                        key={item.id || idx}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isCalling ? "border-2 border-[#0046ad] bg-blue-50/50" : "border-gray-150 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCalling ? "bg-[#0046ad] text-white" : "bg-gray-100 text-gray-700"
                          }`}>
                            #{item.ticketNumber || idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-xs text-gray-900">
                              {item.patientName || (item.user ? `${item.user.firstName} ${item.user.lastName}` : "Patient")}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-semibold block">{item.reason || "General Consultation"}</span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isCalling ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {item.status || "WAITING"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-semibold text-gray-400">
                  No patients currently waiting in queue.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CURRENT PATIENT DETAILS & PRESCRIPTION FORM */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* CURRENT PATIENT CARD */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <UserCheck size={16} className="text-[#0046ad]" />
                Active Patient Consultation Details
              </h3>

              {activeTicket ? (
                <div className="bg-[#f8faff] p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="bg-[#0046ad] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      IN CONSULTATION
                    </span>
                    <h2 className="text-lg font-extrabold text-gray-900 mt-2">
                      {activeTicket.patientName || (activeTicket.user ? `${activeTicket.user.firstName} ${activeTicket.user.lastName}` : "Eleanor Fitzgerald")}
                    </h2>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Reason: <strong className="text-gray-700">{activeTicket.reason || "Routine Heart Checkup"}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#0046ad]">#{activeTicket.ticketNumber || "A-101"}</span>
                    <span className="text-[10px] text-gray-400 block font-bold">Ticket Number</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs font-semibold text-gray-400">
                  No patient currently in consultation room. Click "Call Next Patient" to start.
                </div>
              )}
            </div>

            {/* PRESCRIPTION FORM (POST /pharmacy/prescriptions) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Pill size={16} className="text-[#0046ad]" />
                Write Patient Prescription (POST /pharmacy/prescriptions)
              </h3>

              <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Medication Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin / Paracetamol 500mg"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions / Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. Take 1 tablet twice daily"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={prescriptionMutation.isPending}
                  className="w-full bg-[#0046ad] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 mt-2 disabled:opacity-50"
                >
                  <Send size={15} />
                  {prescriptionMutation.isPending ? "Issuing Prescription..." : "Issue Prescription to Pharmacy"}
                </button>
              </form>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}