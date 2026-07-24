// app/appointments/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link"; // Corrected Next.js Link import
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDoctors, fetchAvailableSlots, bookAppointment, fetchMyAppointments } from "@/lib/api/patient";
import { useAuthStore } from "@/store/auth-store";
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Clock, 
  Calendar, 
  Star, 
  CheckCircle, 
  Circle, 
  CalendarCheck,
  History,
  ArrowRight,
  Plus
} from "lucide-react";

// Local Doctor interface definition to prevent Next.js build type errors
interface Doctor {
  id: string;
  specialty?: string;
  bio?: string;
  rating?: string | number;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

const DATE_SLOTS = [
  { day: "MON", date: "23" },
  { day: "TUE", date: "24" },
  { day: "WED", date: "25" },
  { day: "THU", date: "26" },
  { day: "FRI", date: "27" },
  { day: "SAT", date: "28" },
  { day: "SUN", date: "29" }
];

export default function BookAppointmentPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("25");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");

  // 1. Fetch live doctors from database
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  // Automatically select the first doctor once loaded
  React.useEffect(() => {
    if (doctors.length > 0 && !selectedDocId) {
      setSelectedDocId(doctors[0].id);
    }
  }, [doctors, selectedDocId]);

  const selectedDoctor = doctors.find(d => d.id === selectedDocId);

  // 2. Fetch available slots for the selected doctor and date
  const formattedQueryDate = `2023-10-${selectedDate}`; // Simulating October 2023 calendar
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["slots", selectedDocId, selectedDate],
    queryFn: () => fetchAvailableSlots(selectedDocId, formattedQueryDate),
    enabled: !!selectedDocId,
  });

  // 3. Fetch patient's active appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: fetchMyAppointments,
  });

  // 4. Mutation to confirm a booking
  const bookingMutation = useMutation({
    mutationFn: () => {
      // Combines date and time into a standard timestamp
      const scheduledAt = `${formattedQueryDate}T${selectedTime.includes("PM") ? parseInt(selectedTime) + 12 : selectedTime.split(":")[0]}:00:00Z`;
      return bookAppointment({
        doctorId: selectedDocId,
        scheduledAt,
        reason: reason || "General Consultation",
      });
    },
    onSuccess: () => {
      alert("Appointment successfully booked and queue ticket generated!");
      setSelectedTime("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (err: any) => {
      alert(`Booking failed: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleConfirmAppointment = () => {
    if (!selectedTime) {
      alert("Please select a time slot first.");
      return;
    }
    bookingMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans pb-16 select-none">
      
      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#0046ad] rounded-lg flex items-center justify-center text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H10a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
              <path d="M12 11v6" /><path d="M9 14h6" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#002b49]">HospitalQueue</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/appointments" className="text-sm font-bold text-[#0046ad] border-b-2 border-[#0046ad] pb-1.5 px-0.5">Appointments</Link>
          <Link href="/profile" className="text-sm font-semibold text-gray-500 hover:text-gray-900">Profile</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0046ad]">
            {user?.firstName ? user.firstName[0].toUpperCase() : "P"}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#002b49]">Book an Appointment</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl font-medium">
            Connect with our network of world-class specialists. Expert care is just a few clicks away.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: DOCTOR SELECTOR */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Select Practitioner
              </h3>
              
              {loadingDoctors ? (
                <div className="text-xs text-gray-400 font-semibold py-4">Loading active doctors...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {doctors.map((doc: Doctor) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setSelectedTime("");
                      }}
                      className={`w-full text-left p-4 rounded-2xl border bg-white flex items-center gap-4 transition-all ${
                        selectedDocId === doc.id
                          ? "border-2 border-[#0046ad] shadow-md shadow-blue-500/5"
                          : "border-gray-150 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-50 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[#0046ad] text-base uppercase">
                        {((doc.user?.firstName?.[0] || "") + (doc.user?.lastName?.[0] || ""))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          Dr. {doc.user?.firstName || "Unknown"} {doc.user?.lastName || ""}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">{doc.specialty}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={13} className="fill-amber-400 stroke-amber-400" />
                          <span className="text-xs font-bold text-gray-700">{doc.rating || "5.0"}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDoctor && (
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0046ad]">About Practitioner</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {selectedDoctor.bio || "No custom biography available."}
                </p>
              </div>
            )}
          </div>

          {/* MAIN CALENDAR CARD */}
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#002b49] flex items-center gap-2">
                  <Calendar className="text-[#0046ad] w-5 h-5" />
                  Select Schedule
                </h3>
                {selectedDoctor && (
                  <p className="text-xs text-gray-500 mt-0.5 font-bold">
                    Schedule for Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Date Picker */}
            <div className="grid grid-cols-7 gap-2">
              {DATE_SLOTS.map((slot) => {
                const isActive = selectedDate === slot.date;
                return (
                  <button
                    key={slot.date}
                    onClick={() => {
                      setSelectedDate(slot.date);
                      setSelectedTime("");
                    }}
                    className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl transition-all ${
                      isActive
                        ? "bg-[#0046ad] text-white ring-4 ring-blue-500/15"
                        : "bg-[#f8faff] text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-[9px] font-bold tracking-wider opacity-80 mb-1">{slot.day}</span>
                    <span className="text-base font-bold">{slot.date}</span>
                  </button>
                );
              })}
            </div>

            {/* Slots Area */}
            <div>
              <h4 className="text-xs font-bold text-[#0046ad] tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                Available Slots
              </h4>

              {loadingSlots ? (
                <div className="text-xs text-gray-400 font-semibold py-4">Checking slots...</div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {slots.map((slot: string) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? "border-2 border-[#0046ad] bg-white text-[#0046ad] flex items-center justify-center gap-1 shadow-sm"
                            : "border-gray-200 bg-[#f8faff]/50 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-4 rounded-2xl font-bold flex items-center gap-2">
                  <Info size={16} />
                  No open slots found for this date.
                </div>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Reason for Visit</label>
              <input
                type="text"
                placeholder="e.g. Regular heart health checkup"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-3.5 bg-[#f8faff] border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900"
              />
            </div>

            <button
              onClick={handleConfirmAppointment}
              disabled={bookingMutation.isPending || !selectedTime}
              className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              <CalendarCheck size={18} />
              {bookingMutation.isPending ? "Booking..." : "Confirm Appointment"}
            </button>
          </div>
        </div>

        {/* RECENT VISITS / APPOINTMENTS LIST */}
        <div className="mt-14">
          <h2 className="text-xl font-extrabold text-[#002b49] mb-6 flex items-center gap-2.5">
            <History className="text-[#0046ad] w-5.5 h-5.5" />
            Your Appointment History
          </h2>

          {loadingAppointments ? (
            <div className="text-xs text-gray-400 py-4 font-semibold">Loading appointments...</div>
          ) : appointments.length > 0 ? (
            <div className="flex flex-col gap-4">
              {appointments.map((appt: any) => {
                const isUpcoming = appt.status === "SCHEDULED" || appt.status === "CONFIRMED";
                const dateObj = new Date(appt.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();

                return (
                  <div
                    key={appt.id}
                    className="bg-white border border-gray-150 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 ${
                        isUpcoming ? "bg-[#002b49]" : "bg-blue-100/60 text-[#0046ad]"
                      }`}>
                        <span className="text-[9px] font-extrabold tracking-wide uppercase">{month || "OCT"}</span>
                        <span className="text-xl font-bold leading-none mt-0.5">{day || "25"}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isUpcoming && (
                            <span className="bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">UPCOMING</span>
                          )}
                          <h3 className="font-extrabold text-sm text-gray-900">{appt.reason || "General Consultation"}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                          <span>Dr. {appt.doctorName}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {appt.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-3xl py-12 text-center text-xs font-semibold text-gray-400">
              No appointments found. Use the scheduler above to book your first visit.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}