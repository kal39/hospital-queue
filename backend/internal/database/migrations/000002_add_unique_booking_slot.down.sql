-- Rollback migration for unique booking slot index
DROP INDEX IF EXISTS idx_unique_doctor_scheduled_slot;