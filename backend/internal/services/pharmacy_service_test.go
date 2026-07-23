package services

import (
	"context"
	"testing"

	"hospital-queue/internal/models"
	pkgerrors "hospital-queue/pkg/errors"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// Mock MedicationRepository
type mockMedRepo struct {
	AdjustStockCalls int
	AdjustStockFunc  func(ctx context.Context, id uuid.UUID, delta int) error
}

func (m *mockMedRepo) AdjustStock(ctx context.Context, id uuid.UUID, delta int) error {
	m.AdjustStockCalls++
	if m.AdjustStockFunc != nil {
		return m.AdjustStockFunc(ctx, id, delta)
	}
	return nil
}
func (m *mockMedRepo) Create(ctx context.Context, med *models.Medication) error { return nil }
func (m *mockMedRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.Medication, error) {
	return nil, nil
}
func (m *mockMedRepo) List(ctx context.Context) ([]models.Medication, error)         { return nil, nil }
func (m *mockMedRepo) ListLowStock(ctx context.Context) ([]models.Medication, error) { return nil, nil }
func (m *mockMedRepo) Update(ctx context.Context, med *models.Medication) error      { return nil }
func (m *mockMedRepo) Delete(ctx context.Context, id uuid.UUID) error                { return nil }

// Mock PrescriptionRepository
type mockPrescRepo struct {
	FindByIDFunc func(ctx context.Context, id uuid.UUID) (*models.Prescription, error)
	UpdateFunc   func(ctx context.Context, presc *models.Prescription) error
}

func (m *mockPrescRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.Prescription, error) {
	if m.FindByIDFunc != nil {
		return m.FindByIDFunc(ctx, id)
	}
	return nil, nil
}
func (m *mockPrescRepo) Update(ctx context.Context, presc *models.Prescription) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, presc)
	}
	return nil
}
func (m *mockPrescRepo) Create(ctx context.Context, presc *models.Prescription) error { return nil }
func (m *mockPrescRepo) FindByAppointment(ctx context.Context, appointmentID uuid.UUID) ([]models.Prescription, error) {
	return nil, nil
}
func (m *mockPrescRepo) ListPending(ctx context.Context) ([]models.Prescription, error) {
	return nil, nil
}

// UNIT TESTS
func TestDispensePrescription_DeductsStock(t *testing.T) {
	medID1 := uuid.New()
	medID2 := uuid.New()

	prescriptionID := uuid.New()
	mockPrescription := &models.Prescription{
		ID:     prescriptionID,
		Status: models.PrescriptionPending,
		Items: []models.PrescriptionItem{
			{MedicationID: medID1, Quantity: 10},
			{MedicationID: medID2, Quantity: 5},
		},
	}

	prescRepo := &mockPrescRepo{
		FindByIDFunc: func(ctx context.Context, id uuid.UUID) (*models.Prescription, error) {
			return mockPrescription, nil
		},
		UpdateFunc: func(ctx context.Context, presc *models.Prescription) error {
			assert.Equal(t, models.PrescriptionDispensed, presc.Status)
			return nil
		},
	}

	deductedStock := make(map[uuid.UUID]int)
	medRepo := &mockMedRepo{
		AdjustStockFunc: func(ctx context.Context, id uuid.UUID, delta int) error {
			deductedStock[id] = delta
			return nil
		},
	}

	service := NewPharmacyService(medRepo, prescRepo)

	res, err := service.DispensePrescription(context.Background(), prescriptionID)
	assert.NoError(t, err)
	assert.NotNil(t, res)

	// Assert stock adjustment logic was called twice (once for each item)
	assert.Equal(t, 2, medRepo.AdjustStockCalls)
	assert.Equal(t, -10, deductedStock[medID1])
	assert.Equal(t, -5, deductedStock[medID2])
}

func TestDispensePrescription_AlreadyDispensedConflict(t *testing.T) {
	prescriptionID := uuid.New()
	mockPrescription := &models.Prescription{
		ID:     prescriptionID,
		Status: models.PrescriptionDispensed, // Already dispensed!
	}

	prescRepo := &mockPrescRepo{
		FindByIDFunc: func(ctx context.Context, id uuid.UUID) (*models.Prescription, error) {
			return mockPrescription, nil
		},
	}
	medRepo := &mockMedRepo{}

	service := NewPharmacyService(medRepo, prescRepo)

	res, err := service.DispensePrescription(context.Background(), prescriptionID)
	assert.Error(t, err)
	assert.Nil(t, res)
	assert.Equal(t, pkgerrors.ErrConflict, err)
}
