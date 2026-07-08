package handlers

import (
	"time"

	"hospital-queue/internal/repository"
	"hospital-queue/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AdminHandler struct {
	doctorRepo       repository.DoctorRepository
	patientRepo      repository.PatientRepository
	apptRepo         repository.AppointmentRepository
	medicationRepo   repository.MedicationRepository
	prescriptionRepo repository.PrescriptionRepository
}

func NewAdminHandler(
	doctorRepo repository.DoctorRepository,
	patientRepo repository.PatientRepository,
	apptRepo repository.AppointmentRepository,
	medicationRepo repository.MedicationRepository,
	prescriptionRepo repository.PrescriptionRepository,
) *AdminHandler {
	return &AdminHandler{
		doctorRepo:       doctorRepo,
		patientRepo:      patientRepo,
		apptRepo:         apptRepo,
		medicationRepo:   medicationRepo,
		prescriptionRepo: prescriptionRepo,
	}
}

type dashboardStats struct {
	DoctorCount         int `json:"doctorCount"`
	PatientCount        int `json:"patientCount"`
	AppointmentsToday   int `json:"appointmentsToday"`
	LowStockMedications int `json:"lowStockMedications"`
	PendingPrescriptions int `json:"pendingPrescriptions"`
}

func (h *AdminHandler) Dashboard(c *fiber.Ctx) error {
	ctx := c.Context()

	doctors, err := h.doctorRepo.List(ctx)
	if err != nil {
		return response.InternalServerError(c, "failed to load dashboard")
	}

	_, patientTotal, err := h.patientRepo.List(ctx, 1, 0)
	if err != nil {
		return response.InternalServerError(c, "failed to load dashboard")
	}

	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	_, apptTotal, err := h.apptRepo.FindByDateRange(ctx, dayStart, dayStart.Add(24*time.Hour), 1, 0)
	if err != nil {
		return response.InternalServerError(c, "failed to load dashboard")
	}

	lowStock, err := h.medicationRepo.ListLowStock(ctx)
	if err != nil {
		return response.InternalServerError(c, "failed to load dashboard")
	}

	pending, err := h.prescriptionRepo.ListPending(ctx)
	if err != nil {
		return response.InternalServerError(c, "failed to load dashboard")
	}

	return response.OK(c, dashboardStats{
		DoctorCount:          len(doctors),
		PatientCount:         int(patientTotal),
		AppointmentsToday:    int(apptTotal),
		LowStockMedications:  len(lowStock),
		PendingPrescriptions: len(pending),
	})
}
