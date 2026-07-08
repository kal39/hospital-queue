package services

import (
	"context"

	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	pkgerrors "hospital-queue/pkg/errors"

	"github.com/google/uuid"
)

type CreateMedicationInput struct {
	Name         string `json:"name"         validate:"required,min=1,max=150"`
	Description  string `json:"description"  validate:"omitempty"`
	Unit         string `json:"unit"         validate:"required,max=20"`
	StockQty     int    `json:"stockQty"     validate:"gte=0"`
	ReorderLevel int    `json:"reorderLevel" validate:"gte=0"`
	PriceCents   int    `json:"priceCents"   validate:"gte=0"`
}

type PrescriptionItemInput struct {
	MedicationID uuid.UUID `json:"medicationId" validate:"required"`
	Dosage       string    `json:"dosage"       validate:"required"`
	Quantity     int       `json:"quantity"     validate:"required,gt=0"`
}

type CreatePrescriptionInput struct {
	AppointmentID uuid.UUID               `json:"appointmentId" validate:"required"`
	PatientID     uuid.UUID               `json:"patientId"     validate:"required"`
	DoctorID      uuid.UUID               `json:"doctorId"      validate:"required"`
	Notes         string                  `json:"notes"         validate:"omitempty"`
	Items         []PrescriptionItemInput `json:"items"         validate:"required,min=1,dive"`
}

type PharmacyService interface {
	ListMedications(ctx context.Context) ([]models.Medication, error)
	ListLowStock(ctx context.Context) ([]models.Medication, error)
	CreateMedication(ctx context.Context, input *CreateMedicationInput) (*models.Medication, error)
	AdjustStock(ctx context.Context, id uuid.UUID, delta int) error

	CreatePrescription(ctx context.Context, input *CreatePrescriptionInput) (*models.Prescription, error)
	ListPendingPrescriptions(ctx context.Context) ([]models.Prescription, error)
	DispensePrescription(ctx context.Context, id uuid.UUID) (*models.Prescription, error)
}

type pharmacyService struct {
	medicationRepo   repository.MedicationRepository
	prescriptionRepo repository.PrescriptionRepository
}

func NewPharmacyService(medicationRepo repository.MedicationRepository, prescriptionRepo repository.PrescriptionRepository) PharmacyService {
	return &pharmacyService{medicationRepo: medicationRepo, prescriptionRepo: prescriptionRepo}
}

func (s *pharmacyService) ListMedications(ctx context.Context) ([]models.Medication, error) {
	return s.medicationRepo.List(ctx)
}

func (s *pharmacyService) ListLowStock(ctx context.Context) ([]models.Medication, error) {
	return s.medicationRepo.ListLowStock(ctx)
}

func (s *pharmacyService) CreateMedication(ctx context.Context, input *CreateMedicationInput) (*models.Medication, error) {
	med := &models.Medication{
		Name:         input.Name,
		Description:  input.Description,
		Unit:         input.Unit,
		StockQty:     input.StockQty,
		ReorderLevel: input.ReorderLevel,
		PriceCents:   input.PriceCents,
	}
	if err := s.medicationRepo.Create(ctx, med); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	return med, nil
}

func (s *pharmacyService) AdjustStock(ctx context.Context, id uuid.UUID, delta int) error {
	if err := s.medicationRepo.AdjustStock(ctx, id, delta); err != nil {
		return pkgerrors.ErrInternalServer
	}
	return nil
}

func (s *pharmacyService) CreatePrescription(ctx context.Context, input *CreatePrescriptionInput) (*models.Prescription, error) {
	items := make([]models.PrescriptionItem, len(input.Items))
	for i, it := range input.Items {
		items[i] = models.PrescriptionItem{
			MedicationID: it.MedicationID,
			Dosage:       it.Dosage,
			Quantity:     it.Quantity,
		}
	}

	presc := &models.Prescription{
		AppointmentID: input.AppointmentID,
		PatientID:     input.PatientID,
		DoctorID:      input.DoctorID,
		Notes:         input.Notes,
		Status:        models.PrescriptionPending,
		Items:         items,
	}
	if err := s.prescriptionRepo.Create(ctx, presc); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	return s.prescriptionRepo.FindByID(ctx, presc.ID)
}

func (s *pharmacyService) ListPendingPrescriptions(ctx context.Context) ([]models.Prescription, error) {
	return s.prescriptionRepo.ListPending(ctx)
}

// DispensePrescription deducts stock for every item and marks the prescription dispensed.
func (s *pharmacyService) DispensePrescription(ctx context.Context, id uuid.UUID) (*models.Prescription, error) {
	presc, err := s.prescriptionRepo.FindByID(ctx, id)
	if err != nil {
		return nil, pkgerrors.ErrNotFound
	}
	if presc.Status != models.PrescriptionPending {
		return nil, pkgerrors.ErrConflict
	}

	for _, item := range presc.Items {
		if err := s.medicationRepo.AdjustStock(ctx, item.MedicationID, -item.Quantity); err != nil {
			return nil, pkgerrors.ErrInternalServer
		}
	}

	presc.Status = models.PrescriptionDispensed
	if err := s.prescriptionRepo.Update(ctx, presc); err != nil {
		return nil, pkgerrors.ErrInternalServer
	}
	return presc, nil
}
