// internal/models/patient.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Patient represents a registered patient with soft-delete capabilities
type Patient struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	DOB       string         `json:"dob,omitempty"`
	BloodType string         `json:"blood_type,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Enforces GORM soft-deletes
}