// __tests__/components.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SlotPicker } from "../components/SlotPicker";
import { QueueDisplay } from "../components/QueueDisplay";
import { PrescriptionForm } from "../components/PrescriptionForm";

describe("Frontend Component State Tests", () => {
  
  // 1. SlotPicker Component Tests
  describe("SlotPicker Component", () => {
    it("renders available slots correctly", () => {
      render(<SlotPicker slots={["09:00 AM", "10:00 AM"]} selectedSlot="" onSelectSlot={() => {}} />);
      expect(screen.getByTestId("slot-09:00 AM")).toBeInTheDocument();
      expect(screen.getByTestId("slot-10:00 AM")).toBeInTheDocument();
    });

    it("handles slot selection click state", () => {
      const handleSelect = jest.fn();
      render(<SlotPicker slots={["09:00 AM"]} selectedSlot="" onSelectSlot={handleSelect} />);
      fireEvent.click(screen.getByTestId("slot-09:00 AM"));
      expect(handleSelect).toHaveBeenCalledWith("09:00 AM");
    });

    it("displays empty state when no slots are available", () => {
      render(<SlotPicker slots={[]} selectedSlot="" onSelectSlot={() => {}} />);
      expect(screen.getByTestId("no-slots")).toHaveTextContent("No slots available for this date");
    });
  });

  // 2. QueueDisplay Component Tests
  describe("QueueDisplay Component", () => {
    it("renders queue ticket details accurately", () => {
      render(<QueueDisplay ticketNumber="A-102" status="WAITING" estimatedWaitMinutes={15} />);
      expect(screen.getByTestId("ticket-number")).toHaveTextContent("Ticket #A-102");
      expect(screen.getByTestId("ticket-status")).toHaveTextContent("WAITING");
      expect(screen.getByTestId("wait-time")).toHaveTextContent("Est. wait: 15 mins");
    });

    it("triggers onCallNext callback when Call Next is clicked", () => {
      const handleCall = jest.fn();
      render(<QueueDisplay ticketNumber="A-102" status="WAITING" estimatedWaitMinutes={15} onCallNext={handleCall} />);
      fireEvent.click(screen.getByTestId("call-next-btn"));
      expect(handleCall).toHaveBeenCalledTimes(1);
    });
  });

  // 3. PrescriptionForm Component Tests
  describe("PrescriptionForm Component", () => {
    it("prevents submission and displays validation error when empty", () => {
      const handleSubmit = jest.fn();
      render(<PrescriptionForm onSubmit={handleSubmit} />);
      fireEvent.click(screen.getByTestId("submit-btn"));
      expect(screen.getByTestId("error-message")).toHaveTextContent("Medication name and dosage are required");
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it("submits prescription data when fields are valid", () => {
      const handleSubmit = jest.fn();
      render(<PrescriptionForm onSubmit={handleSubmit} />);
      
      fireEvent.change(screen.getByTestId("input-medication"), { target: { value: "Amoxicillin" } });
      fireEvent.change(screen.getByTestId("input-dosage"), { target: { value: "500mg" } });
      fireEvent.change(screen.getByTestId("input-instructions"), { target: { value: "Take twice daily" } });
      
      fireEvent.click(screen.getByTestId("submit-btn"));
      
      expect(handleSubmit).toHaveBeenCalledWith({
        medication: "Amoxicillin",
        dosage: "500mg",
        instructions: "Take twice daily"
      });
    });
  });

});