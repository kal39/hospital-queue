package repository

import (
	"context"
	"hospital-queue/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PatientRepository interface {
	Create(ctx context.Context, patient *models.Patient) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Patient, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*models.Patient, error)
	List(ctx context.Context, limit, offset int) ([]models.Patient, int64, error)
	Update(ctx context.Context, patient *models.Patient) error
}

type patientRepository struct {
	db *gorm.DB
}

func NewPatientRepository(db *gorm.DB) PatientRepository {
	return &patientRepository{db: db}
}

func (r *patientRepository) Create(ctx context.Context, patient *models.Patient) error {
	return r.db.WithContext(ctx).Create(patient).Error
}

func (r *patientRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Patient, error) {
	var patient models.Patient
	err := r.db.WithContext(ctx).Preload("User").First(&patient, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &patient, nil
}

func (r *patientRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*models.Patient, error) {
	var patient models.Patient
	err := r.db.WithContext(ctx).Preload("User").First(&patient, "user_id = ?", userID).Error
	if err != nil {
		return nil, err
	}
	return &patient, nil
}

func (r *patientRepository) List(ctx context.Context, limit, offset int) ([]models.Patient, int64, error) {
	var patients []models.Patient
	var total int64

	if err := r.db.WithContext(ctx).Model(&models.Patient{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).Preload("User").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&patients).Error
	return patients, total, err
}

func (r *patientRepository) Update(ctx context.Context, patient *models.Patient) error {
	return r.db.WithContext(ctx).Save(patient).Error
}
