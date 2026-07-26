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

type AppointmentService interface {
	Book(ctx context.Context, patientID uuid.UUID, req *BookAppointmentInput) (*models.Appointment, error)
	GetPatientAppointments(ctx context.Context, patientID uuid.UUID) ([]models.Appointment, error)
	GetAvailableSlots(ctx context.Context, doctorID uuid.UUID, dateStr string) ([]string, error)
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

// Book creates an appointment safely while checking for slot overlaps
func (s *appointmentService) Book(ctx context.Context, patientID uuid.UUID, req *BookAppointmentInput) (*models.Appointment, error) {
	if req == nil {
		return nil, errors.New("request payload is required")
	}

	if req.DoctorID == uuid.Nil || req.ScheduledAt.IsZero() {
		return nil, errors.New("doctor ID and scheduled time are required")
	}

	endTime := req.ScheduledAt.Add(30 * time.Minute)

	// 1. Check if time slot is already occupied
	count, err := s.apptRepo.CountOverlapping(ctx, req.DoctorID, req.ScheduledAt, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to check slot availability: %w", err)
	}

	if count > 0 {
		return nil, errors.New("time slot is already booked for this doctor")
	}

	// 2. Build appointment
	appt := &models.Appointment{
		ID:          uuid.New(),
		PatientID:   patientID,
		DoctorID:    req.DoctorID,
		ScheduledAt: req.ScheduledAt,
		Reason:      req.Reason,
		Status:      "SCHEDULED",
	}

	// 3. Persist
	if err := s.apptRepo.Create(ctx, appt); err != nil {
		return nil, fmt.Errorf("failed to create appointment: %w", err)
	}

	// 4. Send async notification
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

func (s *appointmentService) GetAvailableSlots(ctx context.Context, doctorID uuid.UUID, dateStr string) ([]string, error) {
	defaultSlots := []string{
		"09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
		"11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
	}
	return defaultSlots, nil
}
