-- Enforce database-level uniqueness to prevent double-booking for the same doctor and time slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_scheduled_slot 
ON appointments (doctor_id, scheduled_at) 
WHERE status != 'CANCELLED';