// internal/models/audit_log.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditLog captures mutation audit records for compliance and dispute resolution ("who changed what")
type AuditLog struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Action     string         `gorm:"size:100;not null;index" json:"action"`
	EntityName string         `gorm:"size:100;not null;index" json:"entity_name"`
	EntityID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"entity_id"`
	ActorID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"actor_id"`
	OldValue   string         `gorm:"type:text" json:"old_value,omitempty"`
	NewValue   string         `gorm:"type:text" json:"new_value,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
