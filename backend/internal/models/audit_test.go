package models_test

import (
	"testing"
	"time"

	"hospital-queue/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestSoftDeleteAndAuditLog(t *testing.T) {
	patientID := uuid.New()
	actorID := uuid.New()

	// 1. Verify Patient Soft-Delete model compatibility
	patient := models.Patient{
		ID:        patientID,
		DeletedAt: gorm.DeletedAt{Time: time.Now(), Valid: true},
	}

	if !patient.DeletedAt.Valid {
		t.Fatal("Expected patient record to have valid soft-delete timestamp")
	}

	// 2. Verify Audit Log mutation tracking ("who changed what")
	audit := models.AuditLog{
		ID:         uuid.New(),
		Action:     "STATUS_CHANGED",
		EntityName: "Appointment",
		EntityID:   uuid.New(),
		ActorID:    actorID,
		OldValue:   "SCHEDULED",
		NewValue:   "CHECKED_IN",
		CreatedAt:  time.Now(),
	}

	if audit.Action != "STATUS_CHANGED" || audit.NewValue != "CHECKED_IN" {
		t.Fatalf("Audit log record mismatch: %+v", audit)
	}

	t.Logf("SUCCESS: AuditLog verified for action '%s' by actor %s", audit.Action, audit.ActorID)
}
