package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QueueStatus string

const (
	QueueWaiting QueueStatus = "waiting"
	QueueCalled  QueueStatus = "called"
	QueueServing QueueStatus = "serving"
	QueueDone    QueueStatus = "done"
	QueueSkipped QueueStatus = "skipped"
)

// QueueTicket holds a per-day, per-doctor sequential number so patients
// can be called in order without needing the exact appointment time.
type QueueTicket struct {
	ID            uuid.UUID   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AppointmentID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex"                  json:"appointmentId"`
	DoctorID      uuid.UUID   `gorm:"type:uuid;not null;index"                       json:"doctorId"`
	QueueDate     time.Time   `gorm:"type:date;not null;index"                       json:"queueDate"`
	Number        int         `gorm:"not null"                                       json:"number"`
	Status        QueueStatus `gorm:"not null;size:20;index"                         json:"status"`
	CalledAt      *time.Time  `                                                      json:"calledAt,omitempty"`
	CreatedAt     time.Time   `                                                      json:"createdAt"`
	UpdatedAt     time.Time   `                                                      json:"updatedAt"`
}

func (q *QueueTicket) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	if q.Status == "" {
		q.Status = QueueWaiting
	}
	return nil
}
