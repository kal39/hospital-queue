package services

import (
	"context"
	"time"

	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/mailer"
	"hospital-queue/pkg/sms"

	"github.com/google/uuid"
)

type BookAppointmentInput struct {
	DoctorID        uuid.UUID `json:"doctorId"        validate:"required"`
	ScheduledAt     time.Time `json:"scheduledAt"     validate:"required"`
	DurationMinutes int       `json:"durationMinutes" validate:"omitempty,gt=0"`
	Reason          string    `json:"reason"          validate:"omitempty,max=255"`
}

type UpdateAppointmentStatusInput struct {
	Status string `json:"status" validate:"required,oneof=confirmed checked_in in_progress completed cancelled no_show"`
}

type AppointmentService interface {
	Book(ctx context.Context, patientID uuid.UUID, input *BookAppointmentInput) (*models.Appointment, error)
	Get(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
	ListForPatient(ctx context.Context, patientID uuid.UUID, limit, offset int) ([]models.Appointment, int64, error)
	ListForDoctorDay(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.Appointment, error)
	ListForDateRange(ctx context.Context, from, to time.Time, limit, offset int) ([]models.Appointment, int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, input *UpdateAppointmentStatusInput) (*models.Appointment, error)
	Cancel(ctx context.Context, id uuid.UUID) error
	SendReminder(ctx context.Context, id uuid.UUID) error
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
	m *mailer.Mailer,
	s *sms.Sender,
) AppointmentService {
	return &appointmentService{apptRepo: apptRepo, queueRepo: queueRepo, mailer: m, sms: s}
}

func (s *appointmentService) Book(ctx context.Context, patientID uuid.UUID, input *BookAppointmentInput) (*models.Appointment, error) {
	duration := input.DurationMinutes
	if duration == 0 {
		duration = 15
	}
	end := input.ScheduledAt.Add(time.Duration(duration) * time.Minute)

	overlapping, err := s.apptRepo.CountOverlapping(ctx, input.DoctorID, input.ScheduledAt, end)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	if overlapping > 0 {
		return nil, pkgerrors.ErrConflict
	}

	appt := &models.Appointment{
		PatientID:       patientID,
		DoctorID:        input.DoctorID,
		ScheduledAt:     input.ScheduledAt,
		DurationMinutes: duration,
		Status:          models.AppointmentScheduled,
		Reason:          input.Reason,
	}
	if err := s.apptRepo.Create(ctx, appt); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	queueDate := time.Date(input.ScheduledAt.Year(), input.ScheduledAt.Month(), input.ScheduledAt.Day(), 0, 0, 0, 0, input.ScheduledAt.Location())
	number, err := s.queueRepo.NextNumber(ctx, input.DoctorID, queueDate)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	ticket := &models.QueueTicket{
		AppointmentID: appt.ID,
		DoctorID:      input.DoctorID,
		QueueDate:     queueDate,
		Number:        number,
		Status:        models.QueueWaiting,
	}
	if err := s.queueRepo.Create(ctx, ticket); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	return s.apptRepo.FindByID(ctx, appt.ID)
}

func (s *appointmentService) Get(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	appt, err := s.apptRepo.FindByID(ctx, id)
	if err != nil {
		return nil, pkgerrors.ErrNotFound
	}
	return appt, nil
}

func (s *appointmentService) ListForPatient(ctx context.Context, patientID uuid.UUID, limit, offset int) ([]models.Appointment, int64, error) {
	return s.apptRepo.FindByPatient(ctx, patientID, limit, offset)
}

func (s *appointmentService) ListForDoctorDay(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.Appointment, error) {
	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	dayEnd := dayStart.Add(24 * time.Hour)
	return s.apptRepo.FindByDoctorAndDateRange(ctx, doctorID, dayStart, dayEnd)
}

func (s *appointmentService) ListForDateRange(ctx context.Context, from, to time.Time, limit, offset int) ([]models.Appointment, int64, error) {
	return s.apptRepo.FindByDateRange(ctx, from, to, limit, offset)
}

func (s *appointmentService) UpdateStatus(ctx context.Context, id uuid.UUID, input *UpdateAppointmentStatusInput) (*models.Appointment, error) {
	appt, err := s.apptRepo.FindByID(ctx, id)
	if err != nil {
		return nil, pkgerrors.ErrNotFound
	}
	appt.Status = models.AppointmentStatus(input.Status)
	if err := s.apptRepo.Update(ctx, appt); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	if appt.Queue != nil {
		switch appt.Status {
		case models.AppointmentInProgress:
			appt.Queue.Status = models.QueueServing
		case models.AppointmentCompleted:
			appt.Queue.Status = models.QueueDone
		case models.AppointmentCancelled, models.AppointmentNoShow:
			appt.Queue.Status = models.QueueSkipped
		}
		_ = s.queueRepo.Update(ctx, appt.Queue)
	}

	return appt, nil
}

func (s *appointmentService) Cancel(ctx context.Context, id uuid.UUID) error {
	_, err := s.UpdateStatus(ctx, id, &UpdateAppointmentStatusInput{Status: string(models.AppointmentCancelled)})
	return err
}

func (s *appointmentService) SendReminder(ctx context.Context, id uuid.UUID) error {
	appt, err := s.apptRepo.FindByID(ctx, id)
	if err != nil {
		return pkgerrors.ErrNotFound
	}

	whenText := appt.ScheduledAt.Format("Jan 2, 2006 at 3:04 PM")
	patientName := appt.Patient.User.FullName()
	doctorName := "Dr. " + appt.Doctor.User.FullName()

	if appt.Patient.User.Phone != nil {
		_ = s.sms.SendAppointmentReminder(*appt.Patient.User.Phone, patientName, doctorName, whenText)
	}
	if appt.Patient.User.Email != nil {
		_ = s.mailer.SendAppointmentReminder(*appt.Patient.User.Email, patientName, doctorName, whenText)
	}

	now := time.Now()
	appt.ReminderSentAt = &now
	return s.apptRepo.Update(ctx, appt)
}
