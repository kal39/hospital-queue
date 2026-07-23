// app/profile/page.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyProfile, updateMyProfile } from "@/lib/api/patient";
import { useAuthStore } from "@/store/auth-store";
import { ArrowLeft, User, Mail, Phone, Home, ShieldAlert, CheckCircle, Bell } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [success, setSuccess] = useState(false);

  // 1. Fetch current patient profile from DB
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
  });

  // Pre-fill form when data loads
  React.useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setEmergencyContact(profile.emergencyContact || "");
    }
  }, [profile]);

  // 2. Mutation to save profile modifications
  const updateMutation = useMutation({
    mutationFn: () => updateMyProfile({
      phone,
      address,
      emergencyContact,
    }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setTimeout(() => setSuccess(false), 3000); // clear success msg after 3s
    },
    onError: (err: any) => {
      alert(`Update failed: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#002b49] font-sans pb-16 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
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
          <Link href="/appointments" className="text-sm font-semibold text-gray-500 hover:text-gray-900">Appointments</Link>
          <Link href="/profile" className="text-sm font-bold text-[#0046ad] border-b-2 border-[#0046ad] pb-1.5 px-0.5">Profile</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0046ad]">
            {user?.firstName ? user.firstName[0].toUpperCase() : "P"}
          </div>
        </div>
      </header>

      <div className="max-w-[500px] mx-auto px-6 mt-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          
          <Link href="/appointments" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 mb-6">
            <ArrowLeft size={16} />
            Back to Booking Portal
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
            <p className="text-sm text-gray-500 mt-1">
              Verify and update your contact information below.
            </p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-xs font-semibold text-emerald-600 flex items-center gap-2">
              <CheckCircle size={16} />
              Profile updated successfully!
            </div>
          )}

          {isLoading ? (
            <div className="text-xs text-gray-400 py-4 font-semibold">Loading profile...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Static Full Name and MRN */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Patient Name</span>
                  <p className="text-xs font-bold text-gray-800 mt-1">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Medical Record No</span>
                  <p className="text-xs font-black text-[#0046ad] mt-1">{profile?.medicalRecordNo || "Pending Assignment"}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Home Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Home size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Emergency Contact Details</label>
                <textarea
                  rows={2}
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full p-3.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}