package repository

import (
	"context"
	"hospital-queue/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicationRepository interface {
	Create(ctx context.Context, med *models.Medication) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Medication, error)
	List(ctx context.Context) ([]models.Medication, error)
	ListLowStock(ctx context.Context) ([]models.Medication, error)
	Update(ctx context.Context, med *models.Medication) error
	Delete(ctx context.Context, id uuid.UUID) error
	AdjustStock(ctx context.Context, id uuid.UUID, delta int) error
}

type medicationRepository struct {
	db *gorm.DB
}

func NewMedicationRepository(db *gorm.DB) MedicationRepository {
	return &medicationRepository{db: db}
}

func (r *medicationRepository) Create(ctx context.Context, med *models.Medication) error {
	return r.db.WithContext(ctx).Create(med).Error
}

func (r *medicationRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Medication, error) {
	var med models.Medication
	err := r.db.WithContext(ctx).First(&med, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &med, nil
}

func (r *medicationRepository) List(ctx context.Context) ([]models.Medication, error) {
	var meds []models.Medication
	err := r.db.WithContext(ctx).Order("name").Find(&meds).Error
	return meds, err
}

func (r *medicationRepository) ListLowStock(ctx context.Context) ([]models.Medication, error) {
	var meds []models.Medication
	err := r.db.WithContext(ctx).
		Where("stock_qty <= reorder_level").
		Order("name").
		Find(&meds).Error
	return meds, err
}

func (r *medicationRepository) Update(ctx context.Context, med *models.Medication) error {
	return r.db.WithContext(ctx).Save(med).Error
}

func (r *medicationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Medication{}, "id = ?", id).Error
}

func (r *medicationRepository) AdjustStock(ctx context.Context, id uuid.UUID, delta int) error {
	return r.db.WithContext(ctx).Model(&models.Medication{}).
		Where("id = ?", id).
		Update("stock_qty", gorm.Expr("stock_qty + ?", delta)).Error
}

type PrescriptionRepository interface {
	Create(ctx context.Context, presc *models.Prescription) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Prescription, error)
	FindByAppointment(ctx context.Context, appointmentID uuid.UUID) ([]models.Prescription, error)
	ListPending(ctx context.Context) ([]models.Prescription, error)
	Update(ctx context.Context, presc *models.Prescription) error
}

type prescriptionRepository struct {
	db *gorm.DB
}

func NewPrescriptionRepository(db *gorm.DB) PrescriptionRepository {
	return &prescriptionRepository{db: db}
}

func (r *prescriptionRepository) Create(ctx context.Context, presc *models.Prescription) error {
	return r.db.WithContext(ctx).Create(presc).Error
}

func (r *prescriptionRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Prescription, error) {
	var presc models.Prescription
	err := r.db.WithContext(ctx).Preload("Items.Medication").First(&presc, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &presc, nil
}

func (r *prescriptionRepository) FindByAppointment(ctx context.Context, appointmentID uuid.UUID) ([]models.Prescription, error) {
	var prescs []models.Prescription
	err := r.db.WithContext(ctx).
		Preload("Items.Medication").
		Where("appointment_id = ?", appointmentID).
		Find(&prescs).Error
	return prescs, err
}

func (r *prescriptionRepository) ListPending(ctx context.Context) ([]models.Prescription, error) {
	var prescs []models.Prescription
	err := r.db.WithContext(ctx).
		Preload("Items.Medication").
		Where("status = ?", models.PrescriptionPending).
		Order("created_at").
		Find(&prescs).Error
	return prescs, err
}

func (r *prescriptionRepository) Update(ctx context.Context, presc *models.Prescription) error {
	return r.db.WithContext(ctx).Save(presc).Error
}
