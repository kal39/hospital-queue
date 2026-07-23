// app/register/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { registerPatient } from "@/lib/api/auth";
import { ArrowLeft, UserPlus, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("M");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await registerPatient({
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        password,
        gender,
        address: address || undefined,
        emergencyContact: emergencyContact || undefined,
      });

      // Save tokens for Axios Interceptor to read automatically
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", response.tokens.accessToken);
        localStorage.setItem("refreshToken", response.tokens.refreshToken);
      }

      setAuth(response.user, response.tokens.accessToken);
      router.push("/appointments");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to register. Please check your inputs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex flex-col items-center justify-between p-6 relative overflow-y-auto select-none">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-50/70 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[500px] z-10 py-10">
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 mb-6">
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Patient Account</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Fill in your details to register as a new patient in our clinical system.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-150 rounded-xl text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 555-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Home Address</label>
              <input
                type="text"
                placeholder="123 Main St, City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Emergency Contact (Phone)</label>
              <input
                type="text"
                placeholder="Emergency Contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/5 mt-4 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Complete Registration"}
              <UserPlus size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className="w-full text-center flex flex-col items-center gap-2 mt-auto pt-6 border-t border-gray-100/50">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <ShieldCheck size={14} className="text-gray-400" />
          <span>Secure Clinical Access Portal</span>
        </div>
      </div>
    </div>
  );
}