package handlers

import (
	"hospital-queue/internal/models"
	"hospital-queue/internal/services"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type QueueHandler struct {
	queueSvc services.QueueService
}

func NewQueueHandler(queueSvc services.QueueService) *QueueHandler {
	return &QueueHandler{queueSvc: queueSvc}
}

func (h *QueueHandler) ListToday(c *fiber.Ctx) error {
	doctorID, err := uuid.Parse(c.Params("doctorId"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}
	tickets, err := h.queueSvc.ListToday(c.Context(), doctorID)
	if err != nil {
		return response.InternalServerError(c, "failed to fetch queue")
	}
	return response.OK(c, tickets)
}

func (h *QueueHandler) CallNext(c *fiber.Ctx) error {
	doctorID, err := uuid.Parse(c.Params("doctorId"))
	if err != nil {
		return response.BadRequest(c, "invalid doctor id")
	}
	ticket, err := h.queueSvc.CallNext(c.Context(), doctorID)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrNotFound):
			return response.NotFound(c, "no patients waiting")
		default:
			return response.InternalServerError(c, "failed to call next patient")
		}
	}
	return response.OK(c, ticket)
}

func (h *QueueHandler) UpdateStatus(c *fiber.Ctx) error {
	ticketID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid ticket id")
	}

	var body struct {
		Status string `json:"status" validate:"required,oneof=waiting called serving done skipped"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	ticket, err := h.queueSvc.UpdateStatus(c.Context(), ticketID, models.QueueStatus(body.Status))
	if err != nil {
		return response.InternalServerError(c, "failed to update ticket")
	}
	return response.OK(c, ticket)
}
