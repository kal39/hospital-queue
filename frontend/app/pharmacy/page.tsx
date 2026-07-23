"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  RefreshCw,
  LayoutDashboard,
  Layers,
  Calendar,
  Users,
  AlertCircle,
  Truck,
  Plus,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface Prescription {
  ticket: string;
  medication: string;
  patient: string;
  age: number;
  waitTime: string;
  instructions: string;
}

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    ticket: "P-882",
    medication: "Amoxicillin 500mg",
    patient: "Robert J. Wilson",
    age: 72,
    waitTime: "05:12",
    instructions: "Take 1 capsule three times daily for 7 days."
  },
  {
    ticket: "P-883",
    medication: "Lisinopril 10mg",
    patient: "Sarah McAllister",
    age: 45,
    waitTime: "12:45",
    instructions: "Take 1 tablet daily in the morning."
  },
  {
    ticket: "P-884",
    medication: "Atorvastatin 40mg",
    patient: "James Chen",
    age: 58,
    waitTime: "18:22",
    instructions: "Take 1 tablet at bedtime."
  }
];

interface InventoryItem {
  name: string;
  ref: string;
  unit: string;
  stock: number;
  isLow: boolean;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { name: "Insulin Aspart", ref: "INS-402", unit: "Vial", stock: 12, isLow: true },
  { name: "Metformin 500mg", ref: "MET-105", unit: "Tabs", stock: 145, isLow: false },
  { name: "Paracetamol 500mg", ref: "PAR-202", unit: "Tabs", stock: 1240, isLow: false },
  { name: "Ibuprofen 400mg", ref: "IBU-301", unit: "Caps", stock: 850, isLow: false },
  { name: "Salbutamol Inhaler", ref: "SAL-112", unit: "Unit", stock: 28, isLow: false }
];

export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Form states for New Batch prescription
  const [newPatient, setNewPatient] = useState("");
  const [newMed, setNewMed] = useState("");
  const [newInstructions, setNewInstructions] = useState("");

  const lowStockCount = inventory.filter(item => item.isLow).length;

  // Dispense Action Handler
  const handleDispense = (ticket: string) => {
    const dispensed = prescriptions.find(p => p.ticket === ticket);
    if (!dispensed) return;

    // Simulate stock deduction if matching name found
    setInventory(prev =>
      prev.map(item => {
        if (dispensed.medication.toLowerCase().includes(item.name.split(" ")[0].toLowerCase())) {
          const nextStock = Math.max(0, item.stock - 30); // Deduct some tablets
          return { ...item, stock: nextStock, isLow: nextStock < 30 };
        }
        return item;
      })
    );

    alert(`Prescription #${ticket} (${dispensed.medication}) dispensed successfully to ${dispensed.patient}.`);
    setPrescriptions(prev => prev.filter(p => p.ticket !== ticket));
  };

  // Add Prescription Batch Handler
  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient || !newMed) return;

    const newPresc: Prescription = {
      ticket: `P-${Math.floor(885 + Math.random() * 100)}`,
      medication: newMed,
      patient: newPatient,
      age: Math.floor(18 + Math.random() * 60),
      waitTime: "00:00",
      instructions: newInstructions || "Take as directed by clinical physician."
    };

    setPrescriptions(prev => [...prev, newPresc]);
    setIsBatchModalOpen(false);
    setNewPatient("");
    setNewMed("");
    setNewInstructions("");
  };

  // Live Timer Count-Up Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPrescriptions(prev =>
        prev.map(p => {
          const [mins, secs] = p.waitTime.split(":").map(Number);
          let nextSecs = secs + 1;
          let nextMins = mins;
          if (nextSecs >= 60) {
            nextSecs = 0;
            nextMins += 1;
          }
          const formattedMins = String(nextMins).padStart(2, "0");
          const formattedSecs = String(nextSecs).padStart(2, "0");
          return { ...p, waitTime: `${formattedMins}:${formattedSecs}` };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-[#002b49] font-sans relative select-none">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white border-r border-gray-150 flex flex-col justify-between p-5 flex-shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col gap-8">
          {/* Logo */}
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
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pl-1">Central Dispensing</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <Link href="/reception" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all">
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
            <Link href="/pharmacy" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-blue-50/70 text-[#0046ad] transition-all">
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

        {/* New Batch Action Button */}
        <button
          onClick={() => setIsBatchModalOpen(true)}
          className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/5"
        >
          <Plus size={16} />
          New Batch
        </button>
      </aside>

      {/* ================= MAIN DASHBOARD BODY ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER PANEL */}
        <header className="bg-white border-b border-gray-150 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-[#002b49] leading-tight">Dispensing Station 04</h1>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Manage active prescriptions and inventory levels</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Low stock indicators */}
            <div className="bg-red-50/70 border border-red-100 text-red-600 rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-2 shadow-sm shadow-red-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              {lowStockCount} Low Stock Alerts
            </div>

            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden border border-gray-200 flex items-center justify-center font-extrabold text-xs text-[#0046ad]">
              PH
            </div>
          </div>
        </header>

        {/* METRICS & DISPENSARY GRID */}
        <div className="p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: PENDING PRESCRIPTIONS (60% width - xl:col-span-7) */}
          <div className="xl:col-span-7 flex flex-col gap-5">
            <div className="flex items-center gap-2.5 mb-2">
              <h3 className="text-md font-bold text-[#002b49]">Pending Prescriptions</h3>
              <span className="bg-blue-50 text-[#0046ad] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {prescriptions.length} Active
              </span>
            </div>

            {prescriptions.length > 0 ? (
              prescriptions.map((pres, idx) => {
                const isNextUp = idx === 0; // Highlight first element
                return (
                  <div
                    key={pres.ticket}
                    className={`bg-white rounded-3xl p-6 border transition-all ${
                      isNextUp
                        ? "border-2 border-[#0046ad] shadow-md shadow-blue-500/5"
                        : "border-gray-150"
                    }`}
                  >
                    {/* Card Header details */}
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <span className={`text-[10px] font-black tracking-wider uppercase ${isNextUp ? "text-[#0046ad]" : "text-gray-400"}`}>
                          {isNextUp ? "Next Up • " : "Pending • "} Ticket #{pres.ticket}
                        </span>
                        <h2 className="text-xl font-bold text-gray-900 mt-1 leading-none">{pres.medication}</h2>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1.5">
                          Patient: <span className="text-gray-800 font-bold">{pres.patient}</span> (Age: {pres.age})
                        </p>
                      </div>

                      {/* Wait Time Indicator */}
                      <div className="text-right">
                        <span className="text-[9px] font-extrabold text-gray-400 tracking-wider uppercase">Wait Time</span>
                        <p className={`text-base font-black leading-none mt-1.5 flex items-center gap-1.5 ${isNextUp ? "text-red-500" : "text-gray-700"}`}>
                          {isNextUp && <Clock size={14} className="text-red-500 animate-pulse" />}
                          {pres.waitTime}
                        </p>
                      </div>
                    </div>

                    {/* Dosage Directions Panel */}
                    <div className="bg-[#f8faff] rounded-2xl border border-gray-100/60 p-4 mb-4 text-xs font-semibold text-gray-700">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dosage Instructions</span>
                      "{pres.instructions}"
                    </div>

                    {/* Dispense Actions */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDispense(pres.ticket)}
                        className={`py-2 px-6 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                          isNextUp
                            ? "bg-[#004197] hover:bg-[#00347a] text-white shadow-sm"
                            : "bg-gray-100 border border-gray-150 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!isNextUp}
                      >
                        <CheckCircle size={14} />
                        Dispense
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-gray-150 rounded-3xl py-12 px-6 text-center shadow-xs">
                <CheckCircle size={36} className="text-emerald-500 mx-auto mb-3.5" />
                <h4 className="font-extrabold text-sm text-gray-800">Prescription Queue Cleaned</h4>
                <p className="text-xs text-gray-400 mt-1 font-semibold">All pending batches have been dispensed.</p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: STOCK INVENTORY (40% width - xl:col-span-5) */}
          <div className="xl:col-span-5 flex flex-col gap-5">
            
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-bold text-[#002b49]">Stock Inventory</h3>
                <button className="text-xs font-bold text-[#0046ad] hover:underline flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin-slow" />
                  Update
                </button>
              </div>

              {/* Inventory Table */}
              <div className="overflow-hidden border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f8faff] border-b border-gray-100">
                      <th className="py-3 px-4 font-extrabold text-gray-400 uppercase tracking-wider">Medication</th>
                      <th className="py-3 px-4 font-extrabold text-gray-400 uppercase tracking-wider">Unit</th>
                      <th className="py-3 px-4 font-extrabold text-gray-400 uppercase tracking-wider text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.ref} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <h4 className="font-bold text-gray-800">{item.name}</h4>
                          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Ref: {item.ref}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-500">{item.unit}</td>
                        <td className={`py-3.5 px-4 text-right font-black ${item.isLow ? "text-red-500" : "text-gray-800"}`}>
                          {item.stock.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Reorder Supplies Callout (Truck Banner) */}
            <div className="bg-[#003b95] text-white rounded-3xl p-5 shadow-md flex items-center justify-between gap-5 relative overflow-hidden">
              <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-sky-200">
                  <Truck size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Reorder Supplies</h4>
                  <p className="text-[10px] text-blue-100/80 font-bold mt-1.5 leading-none">
                    Next scheduled delivery: <span className="text-white font-extrabold">Tomorrow, 9:00 AM</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert("Reorder invoice compiled and submitted to central dispensary warehouse.")}
                className="bg-white hover:bg-gray-50 text-[#004197] py-2.5 px-4 rounded-xl font-bold text-xs transition-colors whitespace-nowrap"
              >
                Order Now
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ================= NEW BATCH PRESCRIPTION DIALOG ================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-[#002b49] mb-1.5 flex items-center gap-2">
              <Plus size={20} className="text-[#0046ad]" />
              New Prescription Batch
            </h3>
            <p className="text-xs text-gray-400 font-bold mb-5 uppercase tracking-wide">Assign direct dispensary ticket</p>
            
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert J. Wilson"
                  value={newPatient}
                  onChange={(e) => setNewPatient(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Prescribed Medication</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={newMed}
                  onChange={(e) => setNewMed(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Dosage Directions</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Take 1 capsule three times daily for 7 days."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full p-3 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#004197] hover:bg-[#00347a] text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Add Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}