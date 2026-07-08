package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin        Role = "admin"
	RoleDoctor       Role = "doctor"
	RoleReceptionist Role = "receptionist"
	RolePharmacist   Role = "pharmacist"
	RolePatient      Role = "patient"
)

type User struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email           *string        `gorm:"uniqueIndex;size:255"                           json:"email,omitempty"`
	Phone           *string        `gorm:"uniqueIndex;size:20"                            json:"phone,omitempty"`
	PasswordHash    string         `gorm:"not null"                                       json:"-"`
	FirstName       string         `gorm:"not null;size:100"                              json:"firstName"`
	LastName        string         `gorm:"not null;size:100"                              json:"lastName"`
	Role            Role           `gorm:"not null;size:20;index"                         json:"role"`
	IsActive        bool           `gorm:"not null;default:true"                          json:"isActive"`
	EmailVerifiedAt *time.Time     `                                                      json:"emailVerifiedAt,omitempty"`
	PhoneVerifiedAt *time.Time     `                                                      json:"phoneVerifiedAt,omitempty"`
	CreatedAt       time.Time      `                                                      json:"createdAt"`
	UpdatedAt       time.Time      `                                                      json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"index"                                          json:"-"`

	Doctor  *Doctor  `gorm:"foreignKey:UserID" json:"-"`
	Patient *Patient `gorm:"foreignKey:UserID" json:"-"`
}

func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}

// Identifier returns the primary login identifier (email preferred, then phone).
func (u *User) Identifier() string {
	if u.Email != nil && *u.Email != "" {
		return *u.Email
	}
	if u.Phone != nil {
		return *u.Phone
	}
	return ""
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type UserResponse struct {
	ID              uuid.UUID  `json:"id"`
	Email           *string    `json:"email,omitempty"`
	Phone           *string    `json:"phone,omitempty"`
	FirstName       string     `json:"firstName"`
	LastName        string     `json:"lastName"`
	Role            Role       `json:"role"`
	IsActive        bool       `json:"isActive"`
	EmailVerifiedAt *time.Time `json:"emailVerifiedAt,omitempty"`
	PhoneVerifiedAt *time.Time `json:"phoneVerifiedAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:              u.ID,
		Email:           u.Email,
		Phone:           u.Phone,
		FirstName:       u.FirstName,
		LastName:        u.LastName,
		Role:            u.Role,
		IsActive:        u.IsActive,
		EmailVerifiedAt: u.EmailVerifiedAt,
		PhoneVerifiedAt: u.PhoneVerifiedAt,
		CreatedAt:       u.CreatedAt,
	}
}
