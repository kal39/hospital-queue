// app/pharmacy/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Package, 
  Clock, 
  RefreshCw
} from "lucide-react";

// API Helpers
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api/v1";

const fetchPrescriptions = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.get(`${getBaseUrl()}/pharmacy/prescriptions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data?.data || res.data || [];
};

const fetchMedications = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.get(`${getBaseUrl()}/pharmacy/medications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data?.data || res.data || [];
};

const dispensePrescriptionApi = async (id: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.put(`${getBaseUrl()}/pharmacy/prescriptions/${id}/status`, 
    { status: "DISPENSED" },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

const updateStockApi = async ({ id, newStock }: { id: string; newStock: number }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const res = await axios.put(`${getBaseUrl()}/pharmacy/medications/${id}`, 
    { stock: newStock },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export default function PharmacyPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"prescriptions" | "stock">("prescriptions");

  // 1. Fetch Prescriptions
  const { data: prescriptions = [], isLoading: loadingPrescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: fetchPrescriptions,
  });

  // 2. Fetch Medications Inventory
  const { data: medications = [], isLoading: loadingMedications, refetch: refetchMedications } = useQuery({
    queryKey: ["medications"],
    queryFn: fetchMedications,
  });

  // 3. Dispense Mutation
  const dispenseMutation = useMutation({
    mutationFn: (id: string) => dispensePrescriptionApi(id),
    onSuccess: () => {
      alert("Prescription dispensed successfully!");
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
    onError: (err: any) => {
      alert(`Dispense failed: ${err.response?.data?.message || err.message}`);
    }
  });

  // 4. Stock Adjustment Mutation
  const stockMutation = useMutation({
    mutationFn: ({ id, newStock }: { id: string; newStock: number }) => updateStockApi({ id, newStock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
    onError: (err: any) => {
      alert(`Stock update failed: ${err.response?.data?.message || err.message}`);
    }
  });

  // Low Stock Items (Stock <= 15)
  const lowStockItems = medications.filter((m: any) => (m.stock ?? m.quantity ?? 0) <= 15);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans pb-16 select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0046ad] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Pill size={20} />
          </div>
          <div>
            <span className="text-lg font-bold text-[#002b49] block leading-tight">Pharmacy Operations Portal</span>
            <span className="text-xs text-gray-500 font-semibold">Prescription Dispensing & Stock Inventory</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { refetchPrescriptions(); refetchMedications(); }} 
            className="p-2 text-gray-500 hover:text-[#0046ad] bg-gray-100 rounded-xl transition-all"
            title="Refresh Pharmacy Data"
          >
            <RefreshCw size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0046ad]">
            Pharm. {user?.lastName || "Staff"}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* TOP BAR / NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#002b49]">Clinical Pharmacy</h1>
            <p className="text-gray-500 text-xs font-semibold mt-1">
              Process pending prescriptions and manage pharmaceutical stock inventory.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "prescriptions"
                  ? "bg-[#0046ad] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Pill size={15} />
              Pending Prescriptions
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "stock"
                  ? "bg-[#0046ad] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Package size={15} />
              Stock Inventory
            </button>
          </div>
        </div>

        {/* LOW-STOCK WARNING LIST BANNER */}
        {lowStockItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase tracking-wider mb-3">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>Low-Stock Inventory Warnings ({lowStockItems.length} Items Below Reorder Level)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {lowStockItems.map((med: any) => (
                <div key={med.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{med.name || "Medication"}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold">{med.dosage || "500mg"}</span>
                  </div>
                  <span className="text-xs font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-xl">
                    {med.stock ?? med.quantity ?? 0} Left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: PENDING PRESCRIPTIONS LIST */}
        {activeTab === "prescriptions" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#002b49] flex items-center gap-2">
                <Clock size={18} className="text-[#0046ad]" />
                Pending Patient Prescriptions
              </h3>
              <span className="text-xs font-bold text-[#0046ad] bg-blue-50 px-3 py-1 rounded-full">
                {prescriptions.length} Prescriptions Total
              </span>
            </div>

            {loadingPrescriptions ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">Loading prescription queue...</div>
            ) : prescriptions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {prescriptions.map((p: any) => {
                  const status = String(p.status || "").toUpperCase();
                  const isDispensed = status === "DISPENSED";

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl border border-gray-150 hover:border-blue-200 transition-all bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0046ad] flex items-center justify-center font-bold text-base flex-shrink-0">
                          <Pill size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-gray-900">
                              {p.medication || p.medicationName || "Amoxicillin 500mg"}
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-[#0046ad]">
                              {p.dosage || "500mg"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-semibold mt-1">
                            Patient: <strong className="text-gray-700">{p.patientName || (p.user ? `${p.user.firstName} ${p.user.lastName}` : "Patient")}</strong>
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                            Instructions: {p.instructions || "Take twice daily after meals"}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isDispensed ? (
                          <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                            <CheckCircle2 size={15} />
                            Dispensed
                          </span>
                        ) : (
                          <button
                            onClick={() => dispenseMutation.mutate(p.id)}
                            disabled={dispenseMutation.isPending}
                            className="px-5 py-2.5 bg-[#0046ad] hover:bg-[#00347a] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />
                            {dispenseMutation.isPending ? "Dispensing..." : "Dispense Medication"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-semibold text-gray-400">
                No pending prescriptions in queue.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEDICATION STOCK TABLE WITH MANUAL ADJUSTMENT */}
        {activeTab === "stock" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#002b49] flex items-center gap-2">
                <Package size={18} className="text-[#0046ad]" />
                Medication Inventory Stock Table
              </h3>
            </div>

            {loadingMedications ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">Loading stock table...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Medication Name</th>
                      <th className="py-3 px-4">Dosage</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4 text-right">Manual Stock Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {medications.map((med: any) => {
                      const currentStock = med.stock ?? med.quantity ?? 50;
                      return (
                        <tr key={med.id} className="hover:bg-gray-50 transition-all">
                          <td className="py-4 px-4 font-bold text-gray-900">{med.name}</td>
                          <td className="py-4 px-4 text-gray-500 font-semibold">{med.dosage || "Standard"}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                              currentStock <= 15 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {currentStock} Units
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => stockMutation.mutate({ id: med.id, newStock: Math.max(0, currentStock - 5) })}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-bold text-xs"
                                title="Decrease stock by 5"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-extrabold px-2 text-xs text-gray-800">{currentStock}</span>
                              <button
                                onClick={() => stockMutation.mutate({ id: med.id, newStock: currentStock + 5 })}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0046ad] rounded-lg font-bold text-xs"
                                title="Increase stock by 5"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}