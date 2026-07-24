// app/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { loginUser } from "@/lib/api/auth";
import { User, Lock, ArrowRight, UserPlus, ShieldCheck, Eye, EyeOff, Sparkles } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || emailOrPhone;
    const loginPass = customPass || password;

    try {
      const response = await loginUser(loginEmail, loginPass);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", response.tokens.accessToken);
        localStorage.setItem("refreshToken", response.tokens.refreshToken);
      }

      setAuth(response.user, response.tokens.accessToken);

      const role = String(response.user?.role || "").toUpperCase();

      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "DOCTOR") {
        router.push("/live-queue");
      } else if (role === "RECEPTIONIST") {
        router.push("/reception");
      } else if (role === "PHARMACIST") {
        router.push("/pharmacy");
      } else {
        router.push("/appointments");
      }
    } catch (err: any) {
      const msg = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        "Invalid email/phone or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Sign-In helper
  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmailOrPhone(demoEmail);
    setPassword(demoPass);
    handleSubmit(null as any, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex flex-col items-center justify-between p-6 relative select-none">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[440px] z-10 py-8">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-[#0046ad] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H10a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
              <path d="M12 11v6" /><path d="M9 14h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#002b49]">HospitalQueue</h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Clinical Management Access</p>
        </div>

        {/* DEMO ACCOUNTS QUICK LOGIN BANNER */}
        <div className="w-full bg-blue-50/80 border border-blue-200/60 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0046ad] mb-2">
            <Sparkles size={14} />
            <span>Staging Test Accounts (1-Click Login)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("eleanor.fitzgerald@example.com", "Password123!")}
              className="py-2 px-2.5 bg-white border border-blue-200 hover:border-blue-500 rounded-xl text-[11px] font-bold text-gray-700 text-left transition-all shadow-2xs"
            >
              👤 Patient Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("doctor@example.com", "Password123!")}
              className="py-2 px-2.5 bg-white border border-blue-200 hover:border-blue-500 rounded-xl text-[11px] font-bold text-gray-700 text-left transition-all shadow-2xs"
            >
              🩺 Doctor Demo
            </button>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your credentials to access your appointments or live queue.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email or Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="name@example.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8faff] border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
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
              className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 mt-2 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In to Dashboard"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">New patient?</span>
            </div>
          </div>

          <Link href="/register" className="block">
            <button className="w-full bg-[#d6e4ff] hover:bg-[#c2d7ff] text-[#0046ad] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
              Create Patient Account
              <UserPlus size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}