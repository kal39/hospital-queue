"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  HelpCircle,
  Play,
  Pause,
  AlertTriangle,
  Send,
  MoreVertical,
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle,
  FileText
} from "lucide-react";

// Types
interface Patient {
  ticket: string;
  name: string;
  tag: "ROUTINE" | "URGENT";
  purpose: string;
  waitingTime: string;
  estWait: string;
  isUrgent?: boolean;
}

const INITIAL_QUEUE: Patient[] = [
  {
    ticket: "B-02",
    name: "Arthur C. Clarke",
    tag: "ROUTINE",
    purpose: "Routine Checkup",
    waitingTime: "12m",
    estWait: "12 min"
  },
  {
    ticket: "A-25",
    name: "Margaret Hamilton",
    tag: "URGENT",
    purpose: "Vaccination",
    waitingTime: "45m",
    estWait: "5 min",
    isUrgent: true
  },
  {
    ticket: "C-11",
    name: "Nikola Tesla",
    tag: "ROUTINE",
    purpose: "Follow-up",
    waitingTime: "38m",
    estWait: "38 min"
  },
  {
    ticket: "D-04",
    name: "Ada Lovelace",
    tag: "ROUTINE",
    purpose: "Consultation",
    waitingTime: "18m",
    estWait: "48 min"
  }
];

export default function LiveQueuePage() {
  const [queue, setQueue] = useState<Patient[]>(INITIAL_QUEUE);
  const [currentlyServing, setCurrentlyServing] = useState({
    ticket: "A-24",
    name: "Eleanor P. Fitzgerald",
    purpose: "General Consultation",
    room: "Room 302",
    duration: "08:45"
  });

  const [activeTab, setActiveTab] = useState<"Patient Info" | "History" | "Docs">("Patient Info");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [prescriptionSearch, setPrescriptionSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Auto-saving...");
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  // Auto-save effect simulation
  useEffect(() => {
    if (!diagnosisNotes) return;
    setIsSaving(true);
    setSaveStatus("Saving...");
    const delayDebounceFn = setTimeout(() => {
      setIsSaving(false);
      setSaveStatus("Saved");
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [diagnosisNotes]);

  // Timer simulation for Session Duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentlyServing(prev => {
        const [mins, secs] = prev.duration.split(":").map(Number);
        let nextSecs = secs + 1;
        let nextMins = mins;
        if (nextSecs >= 60) {
          nextSecs = 0;
          nextMins += 1;
        }
        const formattedMins = String(nextMins).padStart(2, "0");
        const formattedSecs = String(nextSecs).padStart(2, "0");
        return { ...prev, duration: `${formattedMins}:${formattedSecs}` };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Call Next Patient Progression
  const handleCallNextPatient = () => {
    if (queue.length === 0) {
      alert("No more patients waiting in the queue.");
      return;
    }

    const nextPatient = queue[0];
    setCurrentlyServing({
      ticket: nextPatient.ticket,
      name: nextPatient.name,
      purpose: nextPatient.purpose,
      room: "Room 302",
      duration: "00:00"
    });
    setQueue(prev => prev.slice(1));
    setDiagnosisNotes("");
    setPrescriptionSearch("");
    setSaveStatus("Auto-saving...");
  };

  // Complete and send RX flow
  const handleCompleteSendRX = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Prescription for ${currentlyServing.name} completed and dispatched! Loading next patient.`);
    handleCallNextPatient();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans flex flex-col select-none">
      
      {/* ================= 1. HEADER ================= */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0046ad] rounded-lg flex items-center justify-center text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H10a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
              <path d="M12 11v6" /><path d="M9 14h6" />
            </svg>
          </div>
          <span className="text-md font-bold text-[#002b49]">HospitalQueue</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/reception" className="text-sm font-semibold text-gray-500 hover:text-gray-900">Dashboard</Link>
          <Link href="/patients" className="text-sm font-semibold text-gray-500 hover:text-gray-900">Patients</Link>
          <Link href="/live-queue" className="text-sm font-bold text-[#0046ad] border-b-2 border-[#0046ad] pb-1.5 px-0.5">Queue</Link>
          <Link href="/settings" className="text-sm font-semibold text-gray-500 hover:text-gray-900">Settings</Link>
        </nav>

        {/* Profile & Notifications */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <HelpCircle size={20} />
          </button>
          <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden border border-gray-200 flex items-center justify-center font-extrabold text-xs text-[#0046ad]">
            DR
          </div>
        </div>
      </header>

      {/* ================= 2. MAIN SPLIT SCREEN WORKSPACE ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
        
        {/* LEFT COLUMN: LIVE PANEL (col-span-8) */}
        <main className="lg:col-span-8 p-6 border-r border-gray-150 flex flex-col gap-6">
          
          {/* CURRENTLY SERVING HERO CARD */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-4">Currently Serving</h3>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                {/* Big Ticket Symbol */}
                <div className="w-20 h-20 bg-[#0046ad] rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/15">
                  <span className="text-[10px] font-bold opacity-85 leading-none">A-</span>
                  <span className="text-3xl font-black mt-1 leading-none">{currentlyServing.ticket.split("-")[1]}</span>
                </div>
                {/* Details */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{currentlyServing.name}</h2>
                  <div className="flex items-center gap-3.5 text-xs font-bold text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {currentlyServing.purpose}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {currentlyServing.room}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Session Duration */}
              <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 py-3.5 px-6 self-stretch md:self-auto flex flex-col items-center justify-center min-w-[140px]">
                <span className="text-[9px] font-extrabold text-gray-400 tracking-widest uppercase">Session Duration</span>
                <span className="text-2xl font-black text-blue-600 mt-1 tabular-nums">{currentlyServing.duration}</span>
              </div>
            </div>
          </div>

          {/* QUEUE CONTROL ACTION PANEL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleCallNextPatient}
              className="sm:col-span-2 bg-[#004197] hover:bg-[#00347a] text-white py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/15"
            >
              Call Next Patient
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setIsQueuePaused(!isQueuePaused)}
              className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                isQueuePaused
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {isQueuePaused ? <Play size={16} /> : <Pause size={16} />}
              {isQueuePaused ? "Resume Queue" : "Pause Queue"}
            </button>
          </div>

          {/* QUEUE LIST SECTION (14 Patients) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Queue List ({queue.length} Patients)</h3>
              <select className="bg-transparent border-0 text-xs font-bold text-gray-500 hover:text-gray-800 focus:outline-none cursor-pointer">
                <option>Sort by: Time</option>
                <option>Sort by: Priority</option>
              </select>
            </div>

            {/* Waiting Items list */}
            <div className="flex flex-col gap-3">
              {queue.map((pat) => (
                <div
                  key={pat.ticket}
                  className={`bg-white p-4.5 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:border-gray-300 shadow-xs ${
                    pat.isUrgent ? "border-l-4 border-l-red-500 border-gray-150" : "border-gray-150"
                  }`}
                >
                  <div className="flex items-center gap-4.5">
                    {/* Ticket Badges */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-sm text-white ${
                      pat.isUrgent ? "bg-red-600 shadow-md shadow-red-500/10" : "bg-[#0046ad]"
                    }`}>
                      {pat.ticket}
                    </div>

                    {/* Patient detail texts */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-gray-900">{pat.name}</h4>
                        <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-md tracking-wider ${
                          pat.isUrgent ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {pat.tag}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500 mt-1">
                        {pat.purpose} • <span className="text-gray-400">Waiting {pat.waitingTime}</span>
                      </p>
                    </div>
                  </div>

                  {/* Estimated Wait and Option Trigger */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold py-1.5 px-3 rounded-full ${
                      pat.isUrgent ? "bg-red-50 text-red-600 font-extrabold" : "bg-blue-50/50 text-[#0046ad]"
                    }`}>
                      Est. Wait {pat.estWait}
                    </span>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* RIGHT COLUMN: CLINICAL DETAIL WORKSPACE (col-span-4) */}
        <aside className="lg:col-span-4 bg-white border-l border-gray-150 flex flex-col sticky top-0 h-full z-10">
          
          {/* Tabs header */}
          <div className="flex border-b border-gray-150 px-6 py-1">
            {(["Patient Info", "History", "Docs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-center py-4 text-xs font-bold transition-all ${
                  activeTab === tab
                    ? "text-[#0046ad] border-b-2 border-[#0046ad]"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Conditional Tabs render */}
          {activeTab === "Patient Info" && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* CRITICAL CLINICAL ALERTS CARD */}
              <div className="bg-red-50/30 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-red-600">
                  <ShieldAlert size={16} />
                  <h4 className="text-[10px] font-extrabold tracking-wider uppercase">Critical Clinical Alerts</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md tracking-wide uppercase">
                    Allergy: Penicillin
                  </span>
                  <span className="bg-red-100/70 text-red-800 border border-red-200 text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase">
                    Pre-existing: Hypertension
                  </span>
                </div>
              </div>

              {/* PATIENT QUICK INFO PROFILE */}
              <div className="flex items-center gap-4.5 border-b border-gray-100 pb-5">
                <div className="w-12 h-12 rounded-full bg-blue-50 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-base text-[#0046ad] border border-gray-150">
                  EF
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{currentlyServing.name}</h3>
                  <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                    ID: 882-991-00 <span className="mx-1">•</span> F, 68y
                  </p>
                </div>
              </div>

              {/* VITALS GRID */}
              <div>
                <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-3">Vitals</h4>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-[#f8faff] border border-gray-100/60 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">BP (mmHg)</p>
                      <p className="text-base font-black text-gray-800 mt-1">132/88</p>
                    </div>
                    <Activity className="text-blue-500" size={18} />
                  </div>

                  <div className="bg-[#f8faff] border border-gray-100/60 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Pulse (bpm)</p>
                      <p className="text-base font-black text-gray-800 mt-1">74</p>
                    </div>
                    <Heart className="text-red-500" size={18} />
                  </div>

                  <div className="bg-[#f8faff] border border-gray-100/60 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">SpO2</p>
                      <p className="text-base font-black text-gray-800 mt-1">98%</p>
                    </div>
                    <Activity className="text-emerald-500" size={18} />
                  </div>

                  <div className="bg-[#f8faff] border border-gray-100/60 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Temp</p>
                      <p className="text-base font-black text-gray-800 mt-1">36.8°C</p>
                    </div>
                    <Thermometer className="text-amber-500" size={18} />
                  </div>
                </div>
              </div>

              {/* DIGITAL PRESCRIPTION FORM */}
              <form onSubmit={handleCompleteSendRX} className="flex flex-col gap-4 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Digital Prescription</h4>
                  
                  {/* Auto-saving Indicator with dynamic states */}
                  <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
                    {saveStatus}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Diagnosis Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Add clinical observations..."
                    value={diagnosisNotes}
                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                    className="w-full p-3.5 bg-[#f8faff] border border-gray-200 rounded-2xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-[#0046ad] focus:bg-white text-gray-900 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Medication Search & Presets</label>
                  <input
                    type="text"
                    placeholder="Search medications..."
                    value={prescriptionSearch}
                    onChange={(e) => setPrescriptionSearch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-[#0046ad] focus:bg-white text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/5 mt-2"
                >
                  <Send size={14} />
                  Complete & Send RX
                </button>
              </form>

            </div>
          )}

          {activeTab === "History" && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Patient History Logs</h4>
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-[#f8faff] border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                    <span>General Checkup</span>
                    <span>12 Sep 2023</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 mt-1">Dr. Sarah Jenkins</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Stable vitals, prescribed routine blood pressure checkups.</p>
                </div>
                <div className="p-3 bg-[#f8faff] border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                    <span>Cardiology Follow-up</span>
                    <span>04 May 2023</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 mt-1">Dr. Sarah Jenkins</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Minor arrhythmia observed, scheduled stress test.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Docs" && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase">Uploaded Medical Documents</h4>
              <div className="flex flex-col gap-2.5">
                <div className="p-3 bg-[#f8faff] border border-gray-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#0046ad]" />
                    <span className="text-xs font-bold text-gray-700">Lab_Report_Oct_2023.pdf</span>
                  </div>
                  <button className="text-[10px] font-extrabold text-[#0046ad] uppercase hover:underline">View</button>
                </div>
                <div className="p-3 bg-[#f8faff] border border-gray-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#0046ad]" />
                    <span className="text-xs font-bold text-gray-700">ECG_Scan_Results.pdf</span>
                  </div>
                  <button className="text-[10px] font-extrabold text-[#0046ad] uppercase hover:underline">View</button>
                </div>
              </div>
            </div>
          )}

        </aside>

      </div>

    </div>
  );
}