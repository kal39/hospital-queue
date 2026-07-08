package handlers

import (
	"strconv"
	"time"

	"hospital-queue/internal/api/middleware"
	"hospital-queue/internal/repository"
	"hospital-queue/internal/services"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/response"
	"hospital-queue/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AppointmentHandler struct {
	apptSvc     services.AppointmentService
	patientRepo repository.PatientRepository
	validator   *validator.Validator
}

func NewAppointmentHandler(apptSvc services.AppointmentService, patientRepo repository.PatientRepository, v *validator.Validator) *AppointmentHandler {
	return &AppointmentHandler{apptSvc: apptSvc, patientRepo: patientRepo, validator: v}
}

// Book is used by the patient portal — the patient books for themselves.
func (h *AppointmentHandler) Book(c *fiber.Ctx) error {
	userID := middleware.UserIDFromCtx(c)
	patient, err := h.patientRepo.FindByUserID(c.Context(), userID)
	if err != nil {
		return response.NotFound(c, "patient profile not found")
	}

	var input services.BookAppointmentInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	appt, err := h.apptSvc.Book(c.Context(), patient.ID, &input)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrConflict):
			return response.Conflict(c, "that slot is already booked")
		default:
			return response.InternalServerError(c, "failed to book appointment")
		}
	}
	return response.Created(c, appt)
}

func (h *AppointmentHandler) MyAppointments(c *fiber.Ctx) error {
	userID := middleware.UserIDFromCtx(c)
	patient, err := h.patientRepo.FindByUserID(c.Context(), userID)
	if err != nil {
		return response.NotFound(c, "patient profile not found")
	}

	limit, offset := pageParams(c)
	appts, total, err := h.apptSvc.ListForPatient(c.Context(), patient.ID, limit, offset)
	if err != nil {
		return response.InternalServerError(c, "failed to fetch appointments")
	}
	return response.OKWithMeta(c, appts, meta(total, limit, offset))
}

func (h *AppointmentHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid appointment id")
	}
	appt, err := h.apptSvc.Get(c.Context(), id)
	if err != nil {
		return response.NotFound(c, "appointment not found")
	}
	return response.OK(c, appt)
}

// ListByDoctor returns a doctor's appointments for a given day (defaults to today).
func (h *AppointmentHandler) ListByDoctor(c *fiber.Ctx) error {
	doctorID, err := uuid.Parse(c.Params("doctorId"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}

	date := parseDateQuery(c, "date")
	appts, err := h.apptSvc.ListForDoctorDay(c.Context(), doctorID, date)
	if err != nil {
		return response.InternalServerError(c, "failed to fetch appointments")
	}
	return response.OK(c, appts)
}

// List returns all appointments in a date range, for reception/admin views.
func (h *AppointmentHandler) List(c *fiber.Ctx) error {
	from := parseDateQuery(c, "from")
	to := parseDateQuery(c, "to").Add(24 * time.Hour)

	limit, offset := pageParams(c)
	appts, total, err := h.apptSvc.ListForDateRange(c.Context(), from, to, limit, offset)
	if err != nil {
		return response.InternalServerError(c, "failed to fetch appointments")
	}
	return response.OKWithMeta(c, appts, meta(total, limit, offset))
}

func (h *AppointmentHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid appointment id")
	}

	var input services.UpdateAppointmentStatusInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	appt, err := h.apptSvc.UpdateStatus(c.Context(), id, &input)
	if err != nil {
		return response.InternalServerError(c, "failed to update appointment")
	}
	return response.OK(c, appt)
}

func (h *AppointmentHandler) Cancel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid appointment id")
	}
	if err := h.apptSvc.Cancel(c.Context(), id); err != nil {
		return response.InternalServerError(c, "failed to cancel appointment")
	}
	return response.NoContent(c)
}

func (h *AppointmentHandler) SendReminder(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid appointment id")
	}
	if err := h.apptSvc.SendReminder(c.Context(), id); err != nil {
		return response.InternalServerError(c, "failed to send reminder")
	}
	return response.Message(c, "reminder sent")
}

func parseDateQuery(c *fiber.Ctx, key string) time.Time {
	if v := c.Query(key); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			return t
		}
	}
	return time.Now()
}

func pageParams(c *fiber.Ctx) (limit, offset int) {
	limit, _ = strconv.Atoi(c.Query("limit", "20"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	return limit, (page - 1) * limit
}

func meta(total int64, limit, offset int) *response.Meta {
	page := offset/limit + 1
	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}
	return &response.Meta{Page: page, PerPage: limit, Total: total, TotalPages: totalPages}
}
