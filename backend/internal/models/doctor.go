package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Doctor struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"                  json:"userId"`
	Specialty  string    `gorm:"not null;size:100"                              json:"specialty"`
	LicenseNo  string    `gorm:"not null;size:50"                               json:"licenseNo"`
	Bio        string    `gorm:"type:text"                                      json:"bio"`
	RoomNumber string    `gorm:"size:20"                                        json:"roomNumber"`
	CreatedAt  time.Time `                                                      json:"createdAt"`
	UpdatedAt  time.Time `                                                      json:"updatedAt"`

	User      User               `gorm:"foreignKey:UserID"                              json:"user"`
	Schedules []DoctorSchedule   `gorm:"foreignKey:DoctorID;constraint:OnDelete:CASCADE" json:"schedules,omitempty"`
}

func (d *Doctor) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// Weekday follows Go's time.Weekday: Sunday = 0 ... Saturday = 6.
type DoctorSchedule struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"        json:"id"`
	DoctorID    uuid.UUID `gorm:"type:uuid;not null;index"                              json:"doctorId"`
	Weekday     int       `gorm:"not null;check:chk_weekday,weekday BETWEEN 0 AND 6"    json:"weekday"`
	StartTime   string    `gorm:"not null;size:5"                                       json:"startTime"` // "09:00"
	EndTime     string    `gorm:"not null;size:5"                                       json:"endTime"`   // "17:00"
	SlotMinutes int       `gorm:"not null;default:15"                                   json:"slotMinutes"`
	IsActive    bool      `gorm:"not null;default:true"                                 json:"isActive"`
	CreatedAt   time.Time `                                                             json:"createdAt"`
}

func (s *DoctorSchedule) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
