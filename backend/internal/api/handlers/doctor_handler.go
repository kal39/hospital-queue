package handlers

import (
	"time"

	"hospital-queue/internal/services"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/response"
	"hospital-queue/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DoctorHandler struct {
	doctorSvc services.DoctorService
	validator *validator.Validator
}

func NewDoctorHandler(doctorSvc services.DoctorService, v *validator.Validator) *DoctorHandler {
	return &DoctorHandler{doctorSvc: doctorSvc, validator: v}
}

func (h *DoctorHandler) List(c *fiber.Ctx) error {
	doctors, err := h.doctorSvc.List(c.Context())
	if err != nil {
		return response.InternalServerError(c, "failed to fetch doctors")
	}
	return response.OK(c, doctors)
}

func (h *DoctorHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}
	doctor, err := h.doctorSvc.Get(c.Context(), id)
	if err != nil {
		return response.NotFound(c, "doctor not found")
	}
	return response.OK(c, doctor)
}

func (h *DoctorHandler) GetSchedule(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}
	schedule, err := h.doctorSvc.GetSchedule(c.Context(), id)
	if err != nil {
		return response.InternalServerError(c, "failed to fetch schedule")
	}
	return response.OK(c, schedule)
}

func (h *DoctorHandler) AddSchedule(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}

	var input services.SetScheduleInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	schedule, err := h.doctorSvc.AddSchedule(c.Context(), id, &input)
	if err != nil {
		return response.InternalServerError(c, "failed to add schedule")
	}
	return response.Created(c, schedule)
}

func (h *DoctorHandler) RemoveSchedule(c *fiber.Ctx) error {
	doctorID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}
	scheduleID, err := uuid.Parse(c.Params("scheduleId"))
	if err != nil {
		return response.BadRequest(c, "invalid schedule id")
	}

	if err := h.doctorSvc.RemoveSchedule(c.Context(), doctorID, scheduleID); err != nil {
		return response.InternalServerError(c, "failed to remove schedule")
	}
	return response.NoContent(c)
}

func (h *DoctorHandler) AvailableSlots(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}

	dateStr := c.Query("date")
	date := time.Now()
	if dateStr != "" {
		parsed, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return response.BadRequest(c, "invalid date, expected YYYY-MM-DD")
		}
		date = parsed
	}

	slots, err := h.doctorSvc.AvailableSlots(c.Context(), id, date)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrNotFound):
			return response.NotFound(c, "doctor not found")
		default:
			return response.InternalServerError(c, "failed to compute available slots")
		}
	}
	return response.OK(c, slots)
}
