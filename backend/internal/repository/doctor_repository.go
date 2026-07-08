package repository

import (
	"context"
	"hospital-queue/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DoctorRepository interface {
	Create(ctx context.Context, doctor *models.Doctor) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Doctor, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) (*models.Doctor, error)
	List(ctx context.Context) ([]models.Doctor, error)
	Update(ctx context.Context, doctor *models.Doctor) error

	CreateSchedule(ctx context.Context, schedule *models.DoctorSchedule) error
	FindSchedule(ctx context.Context, doctorID uuid.UUID) ([]models.DoctorSchedule, error)
	DeleteSchedule(ctx context.Context, id, doctorID uuid.UUID) error
}

type doctorRepository struct {
	db *gorm.DB
}

func NewDoctorRepository(db *gorm.DB) DoctorRepository {
	return &doctorRepository{db: db}
}

func (r *doctorRepository) Create(ctx context.Context, doctor *models.Doctor) error {
	return r.db.WithContext(ctx).Create(doctor).Error
}

func (r *doctorRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Doctor, error) {
	var doctor models.Doctor
	err := r.db.WithContext(ctx).Preload("User").Preload("Schedules").First(&doctor, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *doctorRepository) FindByUserID(ctx context.Context, userID uuid.UUID) (*models.Doctor, error) {
	var doctor models.Doctor
	err := r.db.WithContext(ctx).Preload("User").First(&doctor, "user_id = ?", userID).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

func (r *doctorRepository) List(ctx context.Context) ([]models.Doctor, error) {
	var doctors []models.Doctor
	err := r.db.WithContext(ctx).Preload("User").Order("created_at").Find(&doctors).Error
	return doctors, err
}

func (r *doctorRepository) Update(ctx context.Context, doctor *models.Doctor) error {
	return r.db.WithContext(ctx).Save(doctor).Error
}

func (r *doctorRepository) CreateSchedule(ctx context.Context, schedule *models.DoctorSchedule) error {
	return r.db.WithContext(ctx).Create(schedule).Error
}

func (r *doctorRepository) FindSchedule(ctx context.Context, doctorID uuid.UUID) ([]models.DoctorSchedule, error) {
	var schedules []models.DoctorSchedule
	err := r.db.WithContext(ctx).
		Where("doctor_id = ? AND is_active = true", doctorID).
		Order("weekday").
		Find(&schedules).Error
	return schedules, err
}

func (r *doctorRepository) DeleteSchedule(ctx context.Context, id, doctorID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND doctor_id = ?", id, doctorID).
		Delete(&models.DoctorSchedule{}).Error
}
