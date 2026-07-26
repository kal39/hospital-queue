// components/EmptyState.tsx
import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Patients Waiting",
  description = "There are currently no patient records or active queue tickets found for this view.",
}) => {
  return (
    <div className="py-12 text-center bg-white rounded-3xl border border-gray-150 p-6 shadow-2xs" data-testid="empty-state">
      <div className="w-12 h-12 bg-blue-50 text-[#0046ad] rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
        <Inbox size={22} />
      </div>
      <h4 className="font-extrabold text-sm text-gray-900" data-testid="empty-title">{title}</h4>
      <p className="text-xs text-gray-400 font-semibold mt-1 max-w-sm mx-auto leading-relaxed" data-testid="empty-desc">
        {description}
      </p>
    </div>
  );
};