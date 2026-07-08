export type Role = "admin" | "doctor" | "receptionist" | "pharmacist" | "patient";

export type User = {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type Doctor = {
  id: string;
  userId: string;
  specialty: string;
  licenseNo: string;
  bio?: string;
  roomNumber?: string;
  user: User;
};

export type DoctorSchedule = {
  id: string;
  doctorId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
};

export type Patient = {
  id: string;
  userId: string;
  medicalRecordNo: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
  user: User;
};

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  reminderSentAt?: string;
  patient?: Patient;
  doctor?: Doctor;
  queue?: QueueTicket;
};

export type QueueStatus = "waiting" | "called" | "serving" | "done" | "skipped";

export type QueueTicket = {
  id: string;
  appointmentId: string;
  doctorId: string;
  queueDate: string;
  number: number;
  status: QueueStatus;
  calledAt?: string;
};

export type Medication = {
  id: string;
  name: string;
  description?: string;
  unit: string;
  stockQty: number;
  reorderLevel: number;
  priceCents: number;
};

export type PrescriptionStatus = "pending" | "dispensed" | "cancelled";

export type PrescriptionItem = {
  id: string;
  medicationId: string;
  dosage: string;
  quantity: number;
  medication?: Medication;
};

export type Prescription = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  status: PrescriptionStatus;
  notes?: string;
  items: PrescriptionItem[];
};
