package services

import (
	"context"
	"time"

	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	pkgerrors "hospital-queue/pkg/errors"

	"github.com/google/uuid"
)

type SetScheduleInput struct {
	Weekday     int    `json:"weekday"     validate:"gte=0,lte=6"`
	StartTime   string `json:"startTime"   validate:"required,len=5"`
	EndTime     string `json:"endTime"     validate:"required,len=5"`
	SlotMinutes int    `json:"slotMinutes" validate:"required,gt=0"`
}

type Slot struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

type DoctorService interface {
	List(ctx context.Context) ([]models.Doctor, error)
	Get(ctx context.Context, id uuid.UUID) (*models.Doctor, error)
	AddSchedule(ctx context.Context, doctorID uuid.UUID, input *SetScheduleInput) (*models.DoctorSchedule, error)
	GetSchedule(ctx context.Context, doctorID uuid.UUID) ([]models.DoctorSchedule, error)
	RemoveSchedule(ctx context.Context, doctorID, scheduleID uuid.UUID) error
	AvailableSlots(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]Slot, error)
}

type doctorService struct {
	doctorRepo repository.DoctorRepository
	apptRepo   repository.AppointmentRepository
}

func NewDoctorService(doctorRepo repository.DoctorRepository, apptRepo repository.AppointmentRepository) DoctorService {
	return &doctorService{doctorRepo: doctorRepo, apptRepo: apptRepo}
}

func (s *doctorService) List(ctx context.Context) ([]models.Doctor, error) {
	return s.doctorRepo.List(ctx)
}

func (s *doctorService) Get(ctx context.Context, id uuid.UUID) (*models.Doctor, error) {
	doctor, err := s.doctorRepo.FindByID(ctx, id)
	if err != nil {
		return nil, pkgerrors.ErrNotFound
	}
	return doctor, nil
}

func (s *doctorService) AddSchedule(ctx context.Context, doctorID uuid.UUID, input *SetScheduleInput) (*models.DoctorSchedule, error) {
	schedule := &models.DoctorSchedule{
		DoctorID:    doctorID,
		Weekday:     input.Weekday,
		StartTime:   input.StartTime,
		EndTime:     input.EndTime,
		SlotMinutes: input.SlotMinutes,
		IsActive:    true,
	}
	if err := s.doctorRepo.CreateSchedule(ctx, schedule); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	return schedule, nil
}

func (s *doctorService) GetSchedule(ctx context.Context, doctorID uuid.UUID) ([]models.DoctorSchedule, error) {
	return s.doctorRepo.FindSchedule(ctx, doctorID)
}

func (s *doctorService) RemoveSchedule(ctx context.Context, doctorID, scheduleID uuid.UUID) error {
	return s.doctorRepo.DeleteSchedule(ctx, scheduleID, doctorID)
}

// AvailableSlots returns the open booking slots for a doctor on a given date,
// derived from their weekly schedule minus any already-booked appointments.
func (s *doctorService) AvailableSlots(ctx context.Context, doctorID uuid.UUID, date time.Time) ([]Slot, error) {
	schedules, err := s.doctorRepo.FindSchedule(ctx, doctorID)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	dayEnd := dayStart.Add(24 * time.Hour)

	booked, err := s.apptRepo.FindByDoctorAndDateRange(ctx, doctorID, dayStart, dayEnd)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	bookedStarts := make(map[int64]bool, len(booked))
	for _, a := range booked {
		if a.Status == models.AppointmentCancelled || a.Status == models.AppointmentNoShow {
			continue
		}
		bookedStarts[a.ScheduledAt.Unix()] = true
	}

	var slots []Slot
	for _, sch := range schedules {
		if !sch.IsActive || int(dayStart.Weekday()) != sch.Weekday {
			continue
		}
		start, err := parseTimeOnDate(dayStart, sch.StartTime)
		if err != nil {
			continue
		}
		end, err := parseTimeOnDate(dayStart, sch.EndTime)
		if err != nil {
			continue
		}

		step := time.Duration(sch.SlotMinutes) * time.Minute
		for t := start; t.Add(step).Compare(end) <= 0; t = t.Add(step) {
			if bookedStarts[t.Unix()] {
				continue
			}
			slots = append(slots, Slot{Start: t, End: t.Add(step)})
		}
	}
	return slots, nil
}

func parseTimeOnDate(day time.Time, hhmm string) (time.Time, error) {
	t, err := time.Parse("15:04", hhmm)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(day.Year(), day.Month(), day.Day(), t.Hour(), t.Minute(), 0, 0, day.Location()), nil
}
