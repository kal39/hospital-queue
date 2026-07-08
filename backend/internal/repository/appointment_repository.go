package repository

import (
	"context"
	"hospital-queue/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentRepository interface {
	Create(ctx context.Context, appt *models.Appointment) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
	FindByPatient(ctx context.Context, patientID uuid.UUID, limit, offset int) ([]models.Appointment, int64, error)
	FindByDoctorAndDateRange(ctx context.Context, doctorID uuid.UUID, from, to time.Time) ([]models.Appointment, error)
	FindByDateRange(ctx context.Context, from, to time.Time, limit, offset int) ([]models.Appointment, int64, error)
	CountOverlapping(ctx context.Context, doctorID uuid.UUID, start, end time.Time) (int64, error)
	Update(ctx context.Context, appt *models.Appointment) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type appointmentRepository struct {
	db *gorm.DB
}

func NewAppointmentRepository(db *gorm.DB) AppointmentRepository {
	return &appointmentRepository{db: db}
}

func (r *appointmentRepository) Create(ctx context.Context, appt *models.Appointment) error {
	return r.db.WithContext(ctx).Create(appt).Error
}

func (r *appointmentRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	var appt models.Appointment
	err := r.db.WithContext(ctx).
		Preload("Patient.User").Preload("Doctor.User").Preload("Queue").
		First(&appt, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &appt, nil
}

func (r *appointmentRepository) FindByPatient(ctx context.Context, patientID uuid.UUID, limit, offset int) ([]models.Appointment, int64, error) {
	var appts []models.Appointment
	var total int64

	q := r.db.WithContext(ctx).Model(&models.Appointment{}).Where("patient_id = ?", patientID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("Doctor.User").Preload("Queue").
		Where("patient_id = ?", patientID).
		Order("scheduled_at DESC").
		Limit(limit).Offset(offset).
		Find(&appts).Error
	return appts, total, err
}

func (r *appointmentRepository) FindByDoctorAndDateRange(ctx context.Context, doctorID uuid.UUID, from, to time.Time) ([]models.Appointment, error) {
	var appts []models.Appointment
	err := r.db.WithContext(ctx).
		Preload("Patient.User").Preload("Queue").
		Where("doctor_id = ? AND scheduled_at BETWEEN ? AND ?", doctorID, from, to).
		Order("scheduled_at").
		Find(&appts).Error
	return appts, err
}

func (r *appointmentRepository) FindByDateRange(ctx context.Context, from, to time.Time, limit, offset int) ([]models.Appointment, int64, error) {
	var appts []models.Appointment
	var total int64

	q := r.db.WithContext(ctx).Model(&models.Appointment{}).Where("scheduled_at BETWEEN ? AND ?", from, to)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Preload("Patient.User").Preload("Doctor.User").
		Where("scheduled_at BETWEEN ? AND ?", from, to).
		Order("scheduled_at").
		Limit(limit).Offset(offset).
		Find(&appts).Error
	return appts, total, err
}

func (r *appointmentRepository) CountOverlapping(ctx context.Context, doctorID uuid.UUID, start, end time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Appointment{}).
		Where("doctor_id = ? AND status NOT IN ? AND scheduled_at < ? AND scheduled_at >= ?",
			doctorID,
			[]models.AppointmentStatus{models.AppointmentCancelled, models.AppointmentNoShow},
			end, start,
		).
		Count(&count).Error
	return count, err
}

func (r *appointmentRepository) Update(ctx context.Context, appt *models.Appointment) error {
	return r.db.WithContext(ctx).Save(appt).Error
}

func (r *appointmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Appointment{}, "id = ?", id).Error
}
