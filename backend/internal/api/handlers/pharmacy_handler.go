package handlers

import (
	"hospital-queue/internal/services"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/response"
	"hospital-queue/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PharmacyHandler struct {
	pharmacySvc services.PharmacyService
	validator   *validator.Validator
}

func NewPharmacyHandler(pharmacySvc services.PharmacyService, v *validator.Validator) *PharmacyHandler {
	return &PharmacyHandler{pharmacySvc: pharmacySvc, validator: v}
}

func (h *PharmacyHandler) ListMedications(c *fiber.Ctx) error {
	meds, err := h.pharmacySvc.ListMedications(c.Context())
	if err != nil {
		return response.InternalServerError(c, "failed to fetch medications")
	}
	return response.OK(c, meds)
}

func (h *PharmacyHandler) ListLowStock(c *fiber.Ctx) error {
	meds, err := h.pharmacySvc.ListLowStock(c.Context())
	if err != nil {
		return response.InternalServerError(c, "failed to fetch low-stock medications")
	}
	return response.OK(c, meds)
}

func (h *PharmacyHandler) CreateMedication(c *fiber.Ctx) error {
	var input services.CreateMedicationInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	med, err := h.pharmacySvc.CreateMedication(c.Context(), &input)
	if err != nil {
		return response.InternalServerError(c, "failed to create medication")
	}
	return response.Created(c, med)
}

func (h *PharmacyHandler) AdjustStock(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid medication id")
	}

	var body struct {
		Delta int `json:"delta" validate:"required"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.pharmacySvc.AdjustStock(c.Context(), id, body.Delta); err != nil {
		return response.InternalServerError(c, "failed to adjust stock")
	}
	return response.Message(c, "stock updated")
}

func (h *PharmacyHandler) CreatePrescription(c *fiber.Ctx) error {
	var input services.CreatePrescriptionInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	presc, err := h.pharmacySvc.CreatePrescription(c.Context(), &input)
	if err != nil {
		return response.InternalServerError(c, "failed to create prescription")
	}
	return response.Created(c, presc)
}

func (h *PharmacyHandler) ListPendingPrescriptions(c *fiber.Ctx) error {
	prescs, err := h.pharmacySvc.ListPendingPrescriptions(c.Context())
	if err != nil {
		return response.InternalServerError(c, "failed to fetch prescriptions")
	}
	return response.OK(c, prescs)
}

func (h *PharmacyHandler) DispensePrescription(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid prescription id")
	}

	presc, err := h.pharmacySvc.DispensePrescription(c.Context(), id)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrNotFound):
			return response.NotFound(c, "prescription not found")
		case pkgerrors.Is(err, pkgerrors.ErrConflict):
			return response.Conflict(c, "prescription already dispensed or cancelled")
		default:
			return response.InternalServerError(c, "failed to dispense prescription")
		}
	}
	return response.OK(c, presc)
}
