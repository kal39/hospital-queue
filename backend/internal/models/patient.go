package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Gender string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
	GenderOther  Gender = "other"
)

type Patient struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex"                  json:"userId"`
	MedicalRecordNo  string     `gorm:"not null;uniqueIndex;size:20"                    json:"medicalRecordNo"`
	DateOfBirth      *time.Time `                                                       json:"dateOfBirth,omitempty"`
	Gender           Gender     `gorm:"size:10"                                        json:"gender,omitempty"`
	Address          string     `gorm:"size:255"                                       json:"address,omitempty"`
	EmergencyContact string     `gorm:"size:100"                                        json:"emergencyContact,omitempty"`
	BloodType        string     `gorm:"size:5"                                         json:"bloodType,omitempty"`
	CreatedAt        time.Time  `                                                       json:"createdAt"`
	UpdatedAt        time.Time  `                                                       json:"updatedAt"`

	User User `gorm:"foreignKey:UserID" json:"user"`
}

func (p *Patient) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
