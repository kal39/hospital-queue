// app/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, ShieldAlert, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulated log for testing purposes
    console.log("Forgot Password requested for:", email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-50/70 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[440px] z-10 py-10">
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 mb-6">
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-[#0046ad] mb-3">
              <KeyRound size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Forgot Password?</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-[280px]">
              No worries. Enter your email and we will send you instructions to reset it.
            </p>
          </div>

          {submitted ? (
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl text-center">
              <h4 className="text-xs font-bold text-[#0046ad] uppercase tracking-wider mb-1">Check your inbox</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                We've simulated a reset email sent to <span className="font-extrabold text-gray-900">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8faff] border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#004197] hover:bg-[#00347a] text-white py-3 px-4 rounded-xl font-bold text-sm transition-colors"
              >
                Reset Password
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center gap-2 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
            <ShieldAlert size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-amber-600 font-semibold leading-relaxed">
              Note: Reset endpoints do not exist on the backend. This is currently simulated.
            </p>
          </div>

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