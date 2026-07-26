// components/ErrorState.tsx
import React from "react";
import { AlertCircle, RefreshCw, Lock } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string | number;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load data",
  message = "An unexpected server or network error occurred.",
  code,
  onRetry,
}) => {
  const is403 = code === 403 || String(code).includes("403");
  const is401 = code === 401 || String(code).includes("401");

  return (
    <div className="p-6 rounded-3xl bg-red-50/70 border border-red-150 text-center max-w-md mx-auto" data-testid="error-state">
      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 font-bold">
        {is403 || is401 ? <Lock size={20} /> : <AlertCircle size={20} />}
      </div>
      <h4 className="font-extrabold text-sm text-gray-900" data-testid="error-title">
        {is403 ? "Access Restricted (403)" : title}
      </h4>
      <p className="text-xs text-gray-500 font-semibold mt-1 mb-4 leading-relaxed" data-testid="error-message">
        {is403 ? "Your current role does not have permission to access these patient records." : message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          data-testid="retry-btn"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw size={14} /> Retry Request
        </button>
      )}
    </div>
  );
};