package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Medication struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"not null;size:150;index"                        json:"name"`
	Description  string    `gorm:"type:text"                                      json:"description,omitempty"`
	Unit         string    `gorm:"not null;size:20"                               json:"unit"` // tablet, ml, capsule...
	StockQty     int       `gorm:"not null;default:0"                             json:"stockQty"`
	ReorderLevel int       `gorm:"not null;default:10"                            json:"reorderLevel"`
	PriceCents   int       `gorm:"not null;default:0"                             json:"priceCents"`
	CreatedAt    time.Time `                                                      json:"createdAt"`
	UpdatedAt    time.Time `                                                      json:"updatedAt"`
}

func (m *Medication) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Medication) IsLowStock() bool {
	return m.StockQty <= m.ReorderLevel
}

type PrescriptionStatus string

const (
	PrescriptionPending   PrescriptionStatus = "pending"
	PrescriptionDispensed PrescriptionStatus = "dispensed"
	PrescriptionCancelled PrescriptionStatus = "cancelled"
)

type Prescription struct {
	ID            uuid.UUID          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AppointmentID uuid.UUID          `gorm:"type:uuid;not null;index"                       json:"appointmentId"`
	PatientID     uuid.UUID          `gorm:"type:uuid;not null;index"                       json:"patientId"`
	DoctorID      uuid.UUID          `gorm:"type:uuid;not null;index"                       json:"doctorId"`
	Status        PrescriptionStatus `gorm:"not null;size:20;index"                         json:"status"`
	Notes         string             `gorm:"type:text"                                      json:"notes,omitempty"`
	CreatedAt     time.Time          `                                                      json:"createdAt"`
	UpdatedAt     time.Time          `                                                      json:"updatedAt"`

	Items []PrescriptionItem `gorm:"foreignKey:PrescriptionID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
}

func (p *Prescription) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	if p.Status == "" {
		p.Status = PrescriptionPending
	}
	return nil
}

type PrescriptionItem struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PrescriptionID uuid.UUID `gorm:"type:uuid;not null;index"                       json:"prescriptionId"`
	MedicationID   uuid.UUID `gorm:"type:uuid;not null;index"                       json:"medicationId"`
	Dosage         string    `gorm:"not null;size:100"                              json:"dosage"`
	Quantity       int       `gorm:"not null"                                       json:"quantity"`

	Medication Medication `gorm:"foreignKey:MedicationID" json:"medication,omitempty"`
}

func (i *PrescriptionItem) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}
