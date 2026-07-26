// components/Navbar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Building2, Calendar, Stethoscope, Pill, Users } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-150 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      <nav aria-label="Clinical Navigation Portal" className="flex items-center gap-6 w-full justify-between">
        <Link 
          href="/" 
          aria-label="HospitalQueue Home Page"
          className="flex items-center gap-2.5 rounded-xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0046ad]"
        >
          <div className="w-9 h-9 bg-[#0046ad] text-white rounded-xl flex items-center justify-center font-bold shadow-2xs">
            <Building2 size={20} aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold text-[#002b49] hidden sm:inline">HospitalQueue</span>
        </Link>

        {/* Touch-Friendly Responsive Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-extrabold text-gray-600">
          <Link 
            href="/appointments" 
            aria-label="Book Appointments Screen"
            className="px-3 py-2 rounded-xl hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0046ad] flex items-center gap-1.5 transition-all"
          >
            <Calendar size={16} aria-hidden="true" />
            <span className="hidden md:inline">Appointments</span>
          </Link>
          <Link 
            href="/reception" 
            aria-label="Front-Desk Reception Screen"
            className="px-3 py-2 rounded-xl hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0046ad] flex items-center gap-1.5 transition-all"
          >
            <Users size={16} aria-hidden="true" />
            <span className="hidden md:inline">Reception</span>
          </Link>
          <Link 
            href="/live-queue" 
            aria-label="Doctor Live Room Queue Screen"
            className="px-3 py-2 rounded-xl hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0046ad] flex items-center gap-1.5 transition-all"
          >
            <Stethoscope size={16} aria-hidden="true" />
            <span className="hidden md:inline">Doctor Queue</span>
          </Link>
          <Link 
            href="/pharmacy" 
            aria-label="Pharmacy Operations Screen"
            className="px-3 py-2 rounded-xl hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0046ad] flex items-center gap-1.5 transition-all"
          >
            <Pill size={16} aria-hidden="true" />
            <span className="hidden md:inline">Pharmacy</span>
          </Link>
        </div>
      </nav>
    </header>
  );
};s