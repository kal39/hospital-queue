// components/SlotPicker.tsx
import React from "react";

interface SlotPickerProps {
  slots: string[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({ slots, selectedSlot, onSelectSlot }) => {
  if (!slots || slots.length === 0) {
    return <div data-testid="no-slots" className="text-gray-400 text-xs font-semibold">No slots available for this date</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2" data-testid="slot-picker">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot;
        return (
          <button
            key={slot}
            type="button"
            data-testid={`slot-${slot}`}
            onClick={() => onSelectSlot(slot)}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
              isSelected ? "bg-[#0046ad] text-white border-[#0046ad]" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
};