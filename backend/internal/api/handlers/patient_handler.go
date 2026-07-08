package handlers

import (
	"hospital-queue/internal/api/middleware"
	"hospital-queue/internal/repository"
	"hospital-queue/pkg/response"
	"hospital-queue/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PatientHandler struct {
	patientRepo repository.PatientRepository
	validator   *validator.Validator
}

func NewPatientHandler(patientRepo repository.PatientRepository, v *validator.Validator) *PatientHandler {
	return &PatientHandler{patientRepo: patientRepo, validator: v}
}

type updatePatientProfileInput struct {
	Address          string `json:"address"          validate:"omitempty,max=255"`
	EmergencyContact string `json:"emergencyContact"  validate:"omitempty,max=100"`
	BloodType        string `json:"bloodType"         validate:"omitempty,max=5"`
}

// Me returns the logged-in patient's own portal profile.
func (h *PatientHandler) Me(c *fiber.Ctx) error {
	userID := middleware.UserIDFromCtx(c)
	patient, err := h.patientRepo.FindByUserID(c.Context(), userID)
	if err != nil {
		return response.NotFound(c, "patient profile not found")
	}
	return response.OK(c, patient)
}

func (h *PatientHandler) UpdateMe(c *fiber.Ctx) error {
	userID := middleware.UserIDFromCtx(c)
	patient, err := h.patientRepo.FindByUserID(c.Context(), userID)
	if err != nil {
		return response.NotFound(c, "patient profile not found")
	}

	var input updatePatientProfileInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	patient.Address = input.Address
	patient.EmergencyContact = input.EmergencyContact
	patient.BloodType = input.BloodType

	if err := h.patientRepo.Update(c.Context(), patient); err != nil {
		return response.InternalServerError(c, "failed to update profile")
	}
	return response.OK(c, patient)
}

// List is used by reception/admin to look up patients.
func (h *PatientHandler) List(c *fiber.Ctx) error {
	limit, offset := pageParams(c)
	patients, total, err := h.patientRepo.List(c.Context(), limit, offset)
	if err != nil {
		return response.InternalServerError(c, "failed to fetch patients")
	}
	return response.OKWithMeta(c, patients, meta(total, limit, offset))
}

func (h *PatientHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid patient id")
	}
	patient, err := h.patientRepo.FindByID(c.Context(), id)
	if err != nil {
		return response.NotFound(c, "patient not found")
	}
	return response.OK(c, patient)
}
