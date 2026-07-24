// app/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { loginUser } from "@/lib/api/auth";
import { User, Lock, ArrowRight, UserPlus, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser(emailOrPhone, password);
      
      // Save tokens for Axios Interceptor to read automatically
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", response.tokens.accessToken);
        localStorage.setItem("refreshToken", response.tokens.refreshToken);
      }

      // Store auth state globally in Zustand
      setAuth(response.user, response.tokens.accessToken);

      // Route users dynamically based on their roles
     const role = response.user.role as any;
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "DOCTOR") {
        router.push("/live-queue");
      } else if (role === "RECEPTIONIST") {
        router.push("/reception");
      } else {
        router.push("/appointments"); // Patients
      }
    } catch (err: any) {
      // Unpack Axios error messages cleanly
      const msg = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-50/70 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[440px] z-10 py-10">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-[#0046ad] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H10a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
              <path d="M12 11v6" /><path d="M9 14h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#002b49] tracking-tight">HospitalQueue</h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Clinical Management Access</p>
        </div>

        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Enter your details to manage your appointments or queue status.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-150 rounded-xl text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="name@example.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8faff] border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#0046ad] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#f8faff] border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-device"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0046ad] focus:ring-[#0046ad] cursor-pointer"
              />
              <label htmlFor="remember-device" className="ml-2.5 text-xs font-medium text-gray-600 cursor-pointer select-none">
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/5 mt-2 disabled:opacity-50"
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
              <span className="bg-white px-3 text-gray-400 font-medium">New to our hospital system?</span>
            </div>
          </div>

          <Link href="/register" className="block">
            <button className="w-full bg-[#d6e4ff] hover:bg-[#c2d7ff] text-[#0046ad] py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
              Register as patient
              <UserPlus size={16} />
            </button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 max-w-[280px] bg-white rounded-xl border border-gray-150 shadow-md p-3.5 hidden md:flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
          <div className="absolute inset-0 bg-[#d6e4ff] flex items-center justify-center text-[#0046ad] font-bold text-sm">
            CS
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 leading-tight">Need immediate assistance?</h4>
          <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
            Call our 24/7 help desk: <span className="font-semibold text-gray-700">0800-QUEUE-ME</span>
          </p>
        </div>
      </div>

      <div className="w-full text-center flex flex-col items-center gap-2 mt-auto pt-6 border-t border-gray-100/50">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <ShieldCheck size={14} className="text-gray-400" />
          <span>Secure Clinical Access Portal</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <Link href="/privacy" className="hover:text-gray-800 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-800 transition-colors">Terms of Service</Link>
          <Link href="/help" className="hover:text-gray-800 transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}