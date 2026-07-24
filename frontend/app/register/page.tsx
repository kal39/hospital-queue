// app/register/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerPatient, loginUser } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { Mail, Phone, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Auto-format phone to E.164 international format required by Go validator
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone.replace(/\D/g, "");
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      // 1. Register the patient
      await registerPatient({
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        password,
      });

      // 2. Auto-login immediately after registration
      const loginRes = await loginUser(email, password);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", loginRes.tokens.accessToken);
        localStorage.setItem("refreshToken", loginRes.tokens.refreshToken);
      }

      setAuth(loginRes.user, loginRes.tokens.accessToken);

      // Redirect directly to Reception
      router.push("/reception");

    } catch (err: any) {
      // Friendly error message parser for Go validation 422 responses
      let rawError = err.response?.data?.error || err.response?.data?.message || err.message || "";
      
      if (rawError.includes("Phone") || rawError.includes("e164")) {
        setError("Please enter a valid phone number with country code (e.g. +15551234567 or +254712345678).");
      } else if (rawError.includes("Password") || rawError.includes("min")) {
        setError("Password must be at least 8 characters long.");
      } else if (rawError.includes("Email") || rawError.includes("duplicate") || rawError.includes("exists")) {
        setError("An account with this email or phone number already exists.");
      } else {
        setError(rawError || "Registration failed. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex flex-col items-center justify-between p-6 relative select-none">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[460px] z-10 py-8">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-[#0046ad] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H10a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
              <path d="M12 11v6" /><path d="M9 14h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#002b49]">HospitalQueue</h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Patient Registration Portal</p>
        </div>

        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Patient Account</h2>
            <p className="text-xs text-gray-500 mt-1">
              Join our digital portal to book appointments and track queue status live.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="Eleanor"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Fitzgerald"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="eleanor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (with Country Code)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Phone size={16} />
                </span>
                <input
                  type="text"
                  placeholder="+15559910000 or +254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <span className="text-[10px] text-gray-400 font-medium mt-1 block">Include '+' and your country code (e.g. +1, +254, +44).</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password (min. 8 characters)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 mt-4 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Create Account & Go to Reception"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Already have an account?{" "}
              <Link href="/" className="font-bold text-[#0046ad] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}