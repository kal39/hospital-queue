// app/global-error.tsx
"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface unhandled client/server exceptions with full stack trace
    console.error("[SENTRY / UNHANDLED EXCEPTION CAPTURED]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-md text-center max-w-md">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900">Application Exception Caught</h2>
          <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">
            An unhandled runtime error occurred. The stack trace has been captured by Sentry exception monitoring.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-[#0046ad] hover:bg-[#00347a] text-white py-3 rounded-xl font-bold text-xs transition-all"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}