package repository

import (
	"context"
	"hospital-queue/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QueueRepository interface {
	Create(ctx context.Context, ticket *models.QueueTicket) error
	NextNumber(ctx context.Context, doctorID uuid.UUID, date time.Time) (int, error)
	FindByAppointment(ctx context.Context, appointmentID uuid.UUID) (*models.QueueTicket, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.QueueTicket, error)
	ListForDoctorToday(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.QueueTicket, error)
	Update(ctx context.Context, ticket *models.QueueTicket) error
}

type queueRepository struct {
	db *gorm.DB
}

func NewQueueRepository(db *gorm.DB) QueueRepository {
	return &queueRepository{db: db}
}

func (r *queueRepository) Create(ctx context.Context, ticket *models.QueueTicket) error {
	return r.db.WithContext(ctx).Create(ticket).Error
}

// NextNumber returns the next sequential queue number for a doctor on a given day.
func (r *queueRepository) NextNumber(ctx context.Context, doctorID uuid.UUID, date time.Time) (int, error) {
	var maxNumber int
	err := r.db.WithContext(ctx).Model(&models.QueueTicket{}).
		Where("doctor_id = ? AND queue_date = ?", doctorID, date.Format("2006-01-02")).
		Select("COALESCE(MAX(number), 0)").
		Scan(&maxNumber).Error
	return maxNumber + 1, err
}

func (r *queueRepository) FindByAppointment(ctx context.Context, appointmentID uuid.UUID) (*models.QueueTicket, error) {
	var ticket models.QueueTicket
	err := r.db.WithContext(ctx).First(&ticket, "appointment_id = ?", appointmentID).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *queueRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.QueueTicket, error) {
	var ticket models.QueueTicket
	err := r.db.WithContext(ctx).First(&ticket, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

func (r *queueRepository) ListForDoctorToday(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.QueueTicket, error) {
	var tickets []models.QueueTicket
	err := r.db.WithContext(ctx).
		Where("doctor_id = ? AND queue_date = ?", doctorID, date.Format("2006-01-02")).
		Order("number").
		Find(&tickets).Error
	return tickets, err
}

func (r *queueRepository) Update(ctx context.Context, ticket *models.QueueTicket) error {
	return r.db.WithContext(ctx).Save(ticket).Error
}
