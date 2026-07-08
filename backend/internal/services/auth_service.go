package services

import (
	"context"
	"fmt"
	stdErrors "errors"
	"strings"
	"time"

	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/jwt"
	"hospital-queue/pkg/password"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RegisterPatientInput struct {
	Email            string `json:"email"            validate:"omitempty,email"`
	Phone            string `json:"phone"             validate:"omitempty"`
	Password         string `json:"password"          validate:"required,min=8"`
	FirstName        string `json:"firstName"         validate:"required,min=1,max=100"`
	LastName         string `json:"lastName"          validate:"required,min=1,max=100"`
	Gender           string `json:"gender"            validate:"omitempty,oneof=male female other"`
	Address          string `json:"address"           validate:"omitempty,max=255"`
	EmergencyContact string `json:"emergencyContact"  validate:"omitempty,max=100"`
	BloodType        string `json:"bloodType"         validate:"omitempty,max=5"`
}

type CreateStaffInput struct {
	Email      string `json:"email"      validate:"required,email"`
	Password   string `json:"password"   validate:"required,min=8"`
	FirstName  string `json:"firstName"  validate:"required,min=1,max=100"`
	LastName   string `json:"lastName"   validate:"required,min=1,max=100"`
	Role       string `json:"role"       validate:"required,oneof=admin doctor receptionist pharmacist"`
	Specialty  string `json:"specialty"  validate:"required_if=Role doctor"`
	LicenseNo  string `json:"licenseNo"  validate:"required_if=Role doctor"`
	RoomNumber string `json:"roomNumber" validate:"omitempty"`
}

type LoginInput struct {
	Identifier string `json:"identifier" validate:"required"`
	Password   string `json:"password"   validate:"required"`
}

type ChangePasswordInput struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword"     validate:"required,min=8"`
}

type AuthResponse struct {
	User   *models.UserResponse `json:"user"`
	Tokens *jwt.TokenPair       `json:"tokens"`
}

type AuthService interface {
	RegisterPatient(ctx context.Context, input *RegisterPatientInput) (*AuthResponse, error)
	CreateStaff(ctx context.Context, input *CreateStaffInput) (*models.UserResponse, error)
	Login(ctx context.Context, input *LoginInput) (*AuthResponse, error)
	RefreshTokens(ctx context.Context, refreshToken string) (*jwt.TokenPair, error)
	GetUser(ctx context.Context, userID uuid.UUID) (*models.UserResponse, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, input *ChangePasswordInput) error
}

type authService struct {
	userRepo    repository.UserRepository
	patientRepo repository.PatientRepository
	doctorRepo  repository.DoctorRepository
	jwtManager  *jwt.Manager
}

func NewAuthService(
	userRepo repository.UserRepository,
	patientRepo repository.PatientRepository,
	doctorRepo repository.DoctorRepository,
	jwtManager *jwt.Manager,
) AuthService {
	return &authService{
		userRepo:    userRepo,
		patientRepo: patientRepo,
		doctorRepo:  doctorRepo,
		jwtManager:  jwtManager,
	}
}

func (s *authService) RegisterPatient(ctx context.Context, input *RegisterPatientInput) (*AuthResponse, error) {
	if input.Email == "" && input.Phone == "" {
		return nil, pkgerrors.ErrValidation
	}

	if err := s.ensureIdentifierFree(ctx, input.Email, input.Phone); err != nil {
		return nil, err
	}

	hash, err := password.Hash(input.Password)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	user := &models.User{
		PasswordHash: hash,
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Role:         models.RolePatient,
		IsActive:     true,
	}
	if input.Email != "" {
		user.Email = &input.Email
	}
	if input.Phone != "" {
		user.Phone = &input.Phone
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	patient := &models.Patient{
		UserID:           user.ID,
		MedicalRecordNo:  generateMRN(),
		Gender:           models.Gender(input.Gender),
		Address:          input.Address,
		EmergencyContact: input.EmergencyContact,
		BloodType:        input.BloodType,
	}
	if err := s.patientRepo.Create(ctx, patient); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	tokens, err := s.jwtManager.GeneratePair(user.ID, user.Identifier(), string(user.Role))
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	return &AuthResponse{User: user.ToResponse(), Tokens: tokens}, nil
}

func (s *authService) CreateStaff(ctx context.Context, input *CreateStaffInput) (*models.UserResponse, error) {
	if err := s.ensureIdentifierFree(ctx, input.Email, ""); err != nil {
		return nil, err
	}

	hash, err := password.Hash(input.Password)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	user := &models.User{
		Email:        &input.Email,
		PasswordHash: hash,
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Role:         models.Role(input.Role),
		IsActive:     true,
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	if user.Role == models.RoleDoctor {
		doctor := &models.Doctor{
			UserID:     user.ID,
			Specialty:  input.Specialty,
			LicenseNo:  input.LicenseNo,
			RoomNumber: input.RoomNumber,
		}
		if err := s.doctorRepo.Create(ctx, doctor); err != nil {
			return nil, pkgerrors.ErrInternalServer
		}
	}

	return user.ToResponse(), nil
}

func (s *authService) Login(ctx context.Context, input *LoginInput) (*AuthResponse, error) {
	var user *models.User
	var err error

	if strings.Contains(input.Identifier, "@") {
		user, err = s.userRepo.FindByEmail(ctx, input.Identifier)
	} else {
		user, err = s.userRepo.FindByPhone(ctx, input.Identifier)
	}
	if err != nil {
		return nil, pkgerrors.ErrInvalidCredentials
	}

	if !password.Verify(input.Password, user.PasswordHash) {
		return nil, pkgerrors.ErrInvalidCredentials
	}
	if !user.IsActive {
		return nil, pkgerrors.ErrForbidden
	}

	tokens, err := s.jwtManager.GeneratePair(user.ID, user.Identifier(), string(user.Role))
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	return &AuthResponse{User: user.ToResponse(), Tokens: tokens}, nil
}

func (s *authService) RefreshTokens(ctx context.Context, refreshToken string) (*jwt.TokenPair, error) {
	claims, err := s.jwtManager.ValidateRefresh(refreshToken)
	if err != nil {
		return nil, pkgerrors.ErrTokenInvalid
	}

	user, err := s.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, pkgerrors.ErrUnauthorized
	}

	tokens, err := s.jwtManager.GeneratePair(user.ID, user.Identifier(), string(user.Role))
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	return tokens, nil
}

func (s *authService) GetUser(ctx context.Context, userID uuid.UUID) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, pkgerrors.ErrNotFound
	}
	return user.ToResponse(), nil
}

func (s *authService) ChangePassword(ctx context.Context, userID uuid.UUID, input *ChangePasswordInput) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return pkgerrors.ErrNotFound
	}

	if !password.Verify(input.CurrentPassword, user.PasswordHash) {
		return pkgerrors.ErrInvalidCredentials
	}

	hash, err := password.Hash(input.NewPassword)
	if err != nil {
		return pkgerrors.ErrInternalServer
	}
	user.PasswordHash = hash

	if err := s.userRepo.Update(ctx, user); err != nil {
		return pkgerrors.ErrInternalServer
	}
	return nil
}

func (s *authService) ensureIdentifierFree(ctx context.Context, email, phone string) error {
	if email != "" {
		existing, err := s.userRepo.FindByEmail(ctx, email)
		if err != nil && !stdErrors.Is(err, gorm.ErrRecordNotFound) {
			return pkgerrors.ErrInternalServer
		}
		if existing != nil {
			return pkgerrors.ErrConflict
		}
	}
	if phone != "" {
		existing, err := s.userRepo.FindByPhone(ctx, phone)
		if err != nil && !stdErrors.Is(err, gorm.ErrRecordNotFound) {
			return pkgerrors.ErrInternalServer
		}
		if existing != nil {
			return pkgerrors.ErrConflict
		}
	}
	return nil
}

func generateMRN() string {
	return fmt.Sprintf("MRN-%d", time.Now().UnixNano()%1_000_000_000)
}
