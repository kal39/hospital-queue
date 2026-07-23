package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentStatus string

const (
	AppointmentScheduled  AppointmentStatus = "scheduled"
	AppointmentConfirmed  AppointmentStatus = "confirmed"
	AppointmentCheckedIn  AppointmentStatus = "checked_in"
	AppointmentInProgress AppointmentStatus = "in_progress"
	AppointmentCompleted  AppointmentStatus = "completed"
	AppointmentCancelled  AppointmentStatus = "cancelled"
	AppointmentNoShow     AppointmentStatus = "no_show"
)

type Appointment struct {
	ID              uuid.UUID         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PatientID       uuid.UUID         `gorm:"type:uuid;not null;index"                       json:"patientId"`
	DoctorID        uuid.UUID         `gorm:"type:uuid;not null;index:idx_appointments_doctor_schedule" json:"doctorId"`
	ScheduledAt     time.Time         `gorm:"not null;index:idx_appointments_doctor_schedule" json:"scheduledAt"`
	DurationMinutes int               `gorm:"not null;default:15"                            json:"durationMinutes"`
	Status          AppointmentStatus `gorm:"not null;size:20;index"                         json:"status"`
	Reason          string            `gorm:"size:255"                                       json:"reason,omitempty"`
	Notes           string            `gorm:"type:text"                                      json:"notes,omitempty"`
	ReminderSentAt  *time.Time        `                                                       json:"reminderSentAt,omitempty"`
	CreatedAt       time.Time         `                                                       json:"createdAt"`
	UpdatedAt       time.Time         `                                                       json:"updatedAt"`

	Patient Patient `gorm:"foreignKey:PatientID" json:"patient,omitempty"`
	Doctor  Doctor  `gorm:"foreignKey:DoctorID"  json:"doctor,omitempty"`
	Queue   *QueueTicket `gorm:"foreignKey:AppointmentID" json:"queue,omitempty"`
}

func (a *Appointment) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	if a.Status == "" {
		a.Status = AppointmentScheduled
	}
	return nil
}