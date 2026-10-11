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
	UserID           uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex;column:user_id" json:"user_id"`
	User             User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	DOB              string         `gorm:"column:dob" json:"dob,omitempty"`
	Gender           Gender         `gorm:"column:gender" json:"gender,omitempty"`
	BloodType        string         `gorm:"column:blood_type" json:"blood_type,omitempty"`
	MedicalRecordNo  string         `gorm:"column:medical_record_no" json:"medical_record_no,omitempty"`
	Address          string         `gorm:"column:address" json:"address,omitempty"`
	EmergencyContact string         `gorm:"column:emergency_contact" json:"emergency_contact,omitempty"`
	CreatedAt        time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedAt        time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`
}