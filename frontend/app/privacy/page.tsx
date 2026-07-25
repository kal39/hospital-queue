// app/privacy/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Trash2, Clock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#002b49] font-sans pb-16 select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0046ad] rounded-xl flex items-center justify-center text-white font-bold">
              <ShieldCheck size={20} />
            </div>
            <span className="text-base font-extrabold text-[#002b49]">HospitalQueue Privacy & Data Policy</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 mt-10">
        <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm space-y-8">
          
          <div>
            <span className="bg-blue-50 text-[#0046ad] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Data Protection & Compliance
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-2">Data Retention & Patient Privacy Policy</h1>
            <p className="text-xs text-gray-500 mt-1 font-semibold">
              Compliant with Statutory Medical Records Standards & Patient Privacy Rights
            </p>
          </div>

          <div className="space-y-6 text-xs leading-relaxed text-gray-700">
            
            <section className="bg-[#f8faff] p-5 rounded-2xl border border-blue-100">
              <h3 className="font-extrabold text-sm text-[#002b49] flex items-center gap-2 mb-2">
                <Clock size={16} className="text-[#0046ad]" />
                1. Data Retention Periods
              </h3>
              <p className="mb-2">
                HospitalQueue retains medical and appointment records in strict accordance with statutory healthcare regulations:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-semibold text-gray-600">
                <li><strong>Medical & Prescription Records:</strong> Retained for 10 years following your last clinical consultation.</li>
                <li><strong>Appointment Records:</strong> Retained for 7 years for statutory audit compliance.</li>
                <li><strong>Queue Activity Logs:</strong> Anonymized and archived after 365 days.</li>
              </ul>
            </section>

            <section className="bg-[#f8faff] p-5 rounded-2xl border border-blue-100">
              <h3 className="font-extrabold text-sm text-[#002b49] flex items-center gap-2 mb-2">
                <Lock size={16} className="text-[#0046ad]" />
                2. Role-Based Access Control (RBAC)
              </h3>
              <p className="mb-2">
                Access to medical information is restricted according to strict role permissions:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-semibold text-gray-600">
                <li><strong>Patients:</strong> Exclusive read access to their own appointments and digital prescriptions.</li>
                <li><strong>Doctors & Clinical Staff:</strong> Access restricted to patients currently assigned to their room queue.</li>
                <li><strong>Front-Desk Staff:</strong> Access limited to scheduling, patient lookup, and check-in workflows.</li>
              </ul>
            </section>

            <section className="bg-[#f8faff] p-5 rounded-2xl border border-blue-100">
              <h3 className="font-extrabold text-sm text-[#002b49] flex items-center gap-2 mb-2">
                <Trash2 size={16} className="text-[#0046ad]" />
                3. Deletion Requests & Anonymization
              </h3>
              <p className="mb-2 leading-relaxed">
                When an account deletion is requested, your account is immediately soft-deleted and login tokens are revoked. Personally identifiable information (email, phone number, name) is anonymized while preserving non-identifiable medical statistics in compliance with health record retention laws.
              </p>
            </section>

          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-400 font-semibold">
              For privacy inquiries or deletion requests, contact our Compliance Officer at <span className="text-[#0046ad]">privacy@hospitalqueue.org</span>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}