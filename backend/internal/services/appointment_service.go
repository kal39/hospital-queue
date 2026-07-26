// internal/services/appointment_service.go
package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	"hospital-queue/pkg/mailer"
	"hospital-queue/pkg/sms"

	"github.com/google/uuid"
)

type BookAppointmentInput struct {
	PatientID   uuid.UUID `json:"patient_id"`
	DoctorID    uuid.UUID `json:"doctor_id"`
	ScheduledAt time.Time `json:"scheduled_at"`
	Reason      string    `json:"reason"`
}

type UpdateAppointmentStatusInput struct {
	Status string `json:"status"`
}

type AppointmentService interface {
	Book(ctx context.Context, patientID uuid.UUID, req *BookAppointmentInput) (*models.Appointment, error)
	GetPatientAppointments(ctx context.Context, patientID uuid.UUID) ([]models.Appointment, error)
	GetAvailableSlots(ctx context.Context, doctorID uuid.UUID, dateStr string) ([]string, error)
	ListForPatient(ctx context.Context, patientID uuid.UUID, page, limit int) ([]models.Appointment, int64, error)
	Get(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
	ListForDoctorDay(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.Appointment, error)
	ListForDateRange(ctx context.Context, startDate, endDate time.Time, page, limit int) ([]models.Appointment, int64, error)
	UpdateStatus(ctx context.Context, apptID uuid.UUID, input *UpdateAppointmentStatusInput) (*models.Appointment, error)
	Cancel(ctx context.Context, apptID uuid.UUID) error
	SendReminder(ctx context.Context, apptID uuid.UUID) error
}

type appointmentService struct {
	apptRepo  repository.AppointmentRepository
	queueRepo repository.QueueRepository
	mailer    *mailer.Mailer
	sms       *sms.Sender
}

func NewAppointmentService(
	apptRepo repository.AppointmentRepository,
	queueRepo repository.QueueRepository,
	mailer *mailer.Mailer,
	sms *sms.Sender,
) AppointmentService {
	return &appointmentService{
		apptRepo:  apptRepo,
		queueRepo: queueRepo,
		mailer:    mailer,
		sms:       sms,
	}
}

func (s *appointmentService) Book(ctx context.Context, patientID uuid.UUID, req *BookAppointmentInput) (*models.Appointment, error) {
	if req == nil {
		return nil, errors.New("request payload is required")
	}

	if req.DoctorID == uuid.Nil || req.ScheduledAt.IsZero() {
		return nil, errors.New("doctor ID and scheduled time are required")
	}

	endTime := req.ScheduledAt.Add(30 * time.Minute)

	count, err := s.apptRepo.CountOverlapping(ctx, req.DoctorID, req.ScheduledAt, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to check slot availability: %w", err)
	}

	if count > 0 {
		return nil, errors.New("time slot is already booked for this doctor")
	}

	appt := &models.Appointment{
		ID:          uuid.New(),
		PatientID:   patientID,
		DoctorID:    req.DoctorID,
		ScheduledAt: req.ScheduledAt,
		Reason:      req.Reason,
		Status:      models.AppointmentStatus("SCHEDULED"),
	}

	if err := s.apptRepo.Create(ctx, appt); err != nil {
		return nil, fmt.Errorf("failed to create appointment: %w", err)
	}

	go func() {
		timeStr := appt.ScheduledAt.Format("2006-01-02 15:04")
		_ = s.mailer.SendAppointmentReminder(patientID.String(), timeStr, "Doctor")
		_ = s.sms.SendAppointmentReminder(patientID.String(), timeStr, "Doctor", "")
	}()

	return appt, nil
}

func (s *appointmentService) GetPatientAppointments(ctx context.Context, patientID uuid.UUID) ([]models.Appointment, error) {
	return []models.Appointment{}, nil
}

func (s *appointmentService) ListForPatient(ctx context.Context, patientID uuid.UUID, page, limit int) ([]models.Appointment, int64, error) {
	return []models.Appointment{}, 0, nil
}

func (s *appointmentService) Get(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	return &models.Appointment{ID: id}, nil
}

func (s *appointmentService) ListForDoctorDay(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.Appointment, error) {
	return []models.Appointment{}, nil
}

func (s *appointmentService) ListForDateRange(ctx context.Context, startDate, endDate time.Time, page, limit int) ([]models.Appointment, int64, error) {
	return []models.Appointment{}, 0, nil
}

func (s *appointmentService) UpdateStatus(ctx context.Context, apptID uuid.UUID, input *UpdateAppointmentStatusInput) (*models.Appointment, error) {
	statusVal := ""
	if input != nil {
		statusVal = input.Status
	}
	return &models.Appointment{ID: apptID, Status: models.AppointmentStatus(statusVal)}, nil
}

func (s *appointmentService) Cancel(ctx context.Context, apptID uuid.UUID) error {
	return nil
}

func (s *appointmentService) SendReminder(ctx context.Context, apptID uuid.UUID) error {
	return nil
}

func (s *appointmentService) GetAvailableSlots(ctx context.Context, doctorID uuid.UUID, dateStr string) ([]string, error) {
	return []string{
		"09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
		"11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
	}, nil
}