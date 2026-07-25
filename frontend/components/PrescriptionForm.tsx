// components/PrescriptionForm.tsx
import React, { useState } from "react";

interface PrescriptionFormProps {
  onSubmit: (data: { medication: string; dosage: string; instructions: string }) => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ onSubmit }) => {
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication || !dosage) {
      setError("Medication name and dosage are required");
      return;
    }
    setError("");
    onSubmit({ medication, dosage, instructions });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="prescription-form" className="space-y-3 bg-white p-4 rounded-2xl border">
      {error && (
        <p data-testid="error-message" className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">
          {error}
        </p>
      )}
      <input
        type="text"
        data-testid="input-medication"
        placeholder="Medication Name (e.g. Amoxicillin)"
        value={medication}
        onChange={(e) => setMedication(e.target.value)}
        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-semibold"
      />
      <input
        type="text"
        data-testid="input-dosage"
        placeholder="Dosage (e.g. 500mg)"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-semibold"
      />
      <input
        type="text"
        data-testid="input-instructions"
        placeholder="Instructions (e.g. Take twice daily after meals)"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-semibold"
      />
      <button
        type="submit"
        data-testid="submit-btn"
        className="w-full bg-[#0046ad] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#00347a]"
      >
        Issue Prescription
      </button>
    </form>
  );
};