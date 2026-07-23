package services

import (
	"context"
	"testing"
	"time"

	"hospital-queue/internal/models"
	pkgerrors "hospital-queue/pkg/errors"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// Mock AppointmentRepository
type mockApptRepo struct {
	CountOverlappingFunc func(ctx context.Context, doctorID uuid.UUID, start, end time.Time) (int64, error)
	CreateFunc           func(ctx context.Context, appt *models.Appointment) error
	FindByIDFunc         func(ctx context.Context, id uuid.UUID) (*models.Appointment, error)
}

func (m *mockApptRepo) Create(ctx context.Context, appt *models.Appointment) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, appt)
	}
	return nil
}
func (m *mockApptRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
	if m.FindByIDFunc != nil {
		return m.FindByIDFunc(ctx, id)
	}
	return &models.Appointment{ID: id}, nil
}
func (m *mockApptRepo) CountOverlapping(ctx context.Context, doctorID uuid.UUID, start, end time.Time) (int64, error) {
	if m.CountOverlappingFunc != nil {
		return m.CountOverlappingFunc(ctx, doctorID, start, end)
	}
	return 0, nil
}
func (m *mockApptRepo) FindByPatient(ctx context.Context, patientID uuid.UUID, limit, offset int) ([]models.Appointment, int64, error) {
	return nil, 0, nil
}
func (m *mockApptRepo) FindByDoctorAndDateRange(ctx context.Context, doctorID uuid.UUID, from, to time.Time) ([]models.Appointment, error) {
	return nil, nil
}
func (m *mockApptRepo) FindByDateRange(ctx context.Context, from, to time.Time, limit, offset int) ([]models.Appointment, int64, error) {
	return nil, 0, nil
}
func (m *mockApptRepo) Update(ctx context.Context, appt *models.Appointment) error { return nil }
func (m *mockApptRepo) Delete(ctx context.Context, id uuid.UUID) error             { return nil }

// Mock QueueRepository
type mockQueueRepo struct {
	CreateFunc     func(ctx context.Context, ticket *models.QueueTicket) error
	NextNumberFunc func(ctx context.Context, doctorID uuid.UUID, date time.Time) (int, error)
}

func (m *mockQueueRepo) Create(ctx context.Context, ticket *models.QueueTicket) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, ticket)
	}
	return nil
}
func (m *mockQueueRepo) NextNumber(ctx context.Context, doctorID uuid.UUID, date time.Time) (int, error) {
	if m.NextNumberFunc != nil {
		return m.NextNumberFunc(ctx, doctorID, date)
	}
	return 1, nil
}
func (m *mockQueueRepo) FindByAppointment(ctx context.Context, appointmentID uuid.UUID) (*models.QueueTicket, error) {
	return nil, nil
}
func (m *mockQueueRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.QueueTicket, error) {
	return nil, nil
}
func (m *mockQueueRepo) ListForDoctorToday(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]models.QueueTicket, error) {
	return nil, nil
}
func (m *mockQueueRepo) Update(ctx context.Context, ticket *models.QueueTicket) error { return nil }

// UNIT TESTS
func TestAppointmentBook_Success(t *testing.T) {
	patientID := uuid.New()
	doctorID := uuid.New()
	scheduledAt := time.Now()

	apptRepo := &mockApptRepo{
		CountOverlappingFunc: func(ctx context.Context, doctorID uuid.UUID, start, end time.Time) (int64, error) {
			return 0, nil // No overlaps
		},
		FindByIDFunc: func(ctx context.Context, id uuid.UUID) (*models.Appointment, error) {
			// Correctly populate the mock return struct matching the service lookup expectation
			return &models.Appointment{
				ID:          id,
				PatientID:   patientID,
				DoctorID:    doctorID,
				ScheduledAt: scheduledAt,
				Status:      models.AppointmentScheduled,
			}, nil
		},
	}
	queueRepo := &mockQueueRepo{
		NextNumberFunc: func(ctx context.Context, dID uuid.UUID, date time.Time) (int, error) {
			return 15, nil
		},
	}

	service := NewAppointmentService(apptRepo, queueRepo, nil, nil)

	input := &BookAppointmentInput{
		DoctorID:    doctorID,
		ScheduledAt: scheduledAt,
		Reason:      "Cardiology checkup",
	}

	appt, err := service.Book(context.Background(), patientID, input)
	assert.NoError(t, err)
	assert.NotNil(t, appt)
	assert.Equal(t, patientID, appt.PatientID)
	assert.Equal(t, doctorID, appt.DoctorID)
}

func TestAppointmentBook_OverlapConflict(t *testing.T) {
	apptRepo := &mockApptRepo{
		CountOverlappingFunc: func(ctx context.Context, doctorID uuid.UUID, start, end time.Time) (int64, error) {
			return 1, nil // Overlap exists!
		},
	}
	queueRepo := &mockQueueRepo{}

	service := NewAppointmentService(apptRepo, queueRepo, nil, nil)

	input := &BookAppointmentInput{
		DoctorID:    uuid.New(),
		ScheduledAt: time.Now(),
		Reason:      "Routine Consult",
	}

	appt, err := service.Book(context.Background(), uuid.New(), input)
	assert.Error(t, err)
	assert.Nil(t, appt)
	assert.Equal(t, pkgerrors.ErrConflict, err)
}
