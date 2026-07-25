// components/QueueDisplay.tsx
import React from "react";

interface QueueDisplayProps {
  ticketNumber: string;
  status: string;
  estimatedWaitMinutes: number;
  onCallNext?: () => void;
}

export const QueueDisplay: React.FC<QueueDisplayProps> = ({
  ticketNumber,
  status,
  estimatedWaitMinutes,
  onCallNext,
}) => {
  return (
    <div className="p-5 border rounded-2xl bg-white shadow-sm" data-testid="queue-display">
      <h3 className="text-xl font-bold text-[#002b49]" data-testid="ticket-number">
        Ticket #{ticketNumber}
      </h3>
      <div className="mt-1 flex items-center gap-2">
        <span data-testid="ticket-status" className="text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-blue-100 text-[#0046ad]">
          {status}
        </span>
        <span data-testid="wait-time" className="text-xs text-gray-500 font-semibold">
          Est. wait: {estimatedWaitMinutes} mins
        </span>
      </div>
      {onCallNext && (
        <button
          type="button"
          data-testid="call-next-btn"
          onClick={onCallNext}
          className="mt-4 w-full bg-[#0046ad] text-white py-2 px-4 rounded-xl text-xs font-bold hover:bg-[#00347a] transition-all"
        >
          Call Next Patient
        </button>
      )}
    </div>
  );
};