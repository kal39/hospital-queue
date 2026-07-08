package services

import (
	"context"
	"time"

	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/sms"

	"github.com/google/uuid"
)

type QueueService interface {
	ListToday(ctx context.Context, doctorID uuid.UUID) ([]models.QueueTicket, error)
	CallNext(ctx context.Context, doctorID uuid.UUID) (*models.QueueTicket, error)
	UpdateStatus(ctx context.Context, ticketID uuid.UUID, status models.QueueStatus) (*models.QueueTicket, error)
}

type queueService struct {
	queueRepo repository.QueueRepository
	apptRepo  repository.AppointmentRepository
	sms       *sms.Sender
}

func NewQueueService(queueRepo repository.QueueRepository, apptRepo repository.AppointmentRepository, s *sms.Sender) QueueService {
	return &queueService{queueRepo: queueRepo, apptRepo: apptRepo, sms: s}
}

func (s *queueService) ListToday(ctx context.Context, doctorID uuid.UUID) ([]models.QueueTicket, error) {
	return s.queueRepo.ListForDoctorToday(ctx, doctorID, time.Now())
}

// CallNext advances the queue: it marks the lowest-numbered waiting ticket as
// called and notifies the patient by SMS.
func (s *queueService) CallNext(ctx context.Context, doctorID uuid.UUID) (*models.QueueTicket, error) {
	tickets, err := s.queueRepo.ListForDoctorToday(ctx, doctorID, time.Now())
	if err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	var next *models.QueueTicket
	for i := range tickets {
		if tickets[i].Status == models.QueueWaiting {
			next = &tickets[i]
			break
		}
	}
	if next == nil {
		return nil, pkgerrors.ErrNotFound
	}

	now := time.Now()
	next.Status = models.QueueCalled
	next.CalledAt = &now
	if err := s.queueRepo.Update(ctx, next); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}

	if appt, err := s.apptRepo.FindByID(ctx, next.AppointmentID); err == nil && appt.Patient.User.Phone != nil {
		_ = s.sms.SendQueueCalledNotice(*appt.Patient.User.Phone, next.Number)
	}

	return next, nil
}

func (s *queueService) UpdateStatus(ctx context.Context, ticketID uuid.UUID, status models.QueueStatus) (*models.QueueTicket, error) {
	ticket, err := s.queueRepo.FindByID(ctx, ticketID)
	if err != nil {
		return nil, pkgerrors.ErrNotFound
	}
	ticket.Status = status
	if err := s.queueRepo.Update(ctx, ticket); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	return ticket, nil
}
