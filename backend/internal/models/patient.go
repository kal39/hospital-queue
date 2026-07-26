// internal/models/patient.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Gender string

const (
	GenderMale   Gender = "MALE"
	GenderFemale Gender = "FEMALE"
	GenderOther  Gender = "OTHER"
)

// Patient represents a registered patient record
type Patient struct {
	ID               uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	User             User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	DOB              string         `json:"dob,omitempty"`
	Gender           Gender         `json:"gender,omitempty"`
	BloodType        string         `json:"blood_type,omitempty"`
	MedicalRecordNo  string         `json:"medical_record_no,omitempty"`
	Address          string         `json:"address,omitempty"`
	EmergencyContact string         `json:"emergency_contact,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}