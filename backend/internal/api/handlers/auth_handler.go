package handlers

import (
	"hospital-queue/internal/api/middleware"
	"hospital-queue/internal/services"
	pkgerrors "hospital-queue/pkg/errors"
	"hospital-queue/pkg/response"
	"hospital-queue/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authSvc   services.AuthService
	validator *validator.Validator
}

func NewAuthHandler(authSvc services.AuthService, v *validator.Validator) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, validator: v}
}

func (h *AuthHandler) RegisterPatient(c *fiber.Ctx) error {
	var input services.RegisterPatientInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	result, err := h.authSvc.RegisterPatient(c.Context(), &input)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrValidation):
			return response.UnprocessableEntity(c, "provide at least an email or phone number")
		case pkgerrors.Is(err, pkgerrors.ErrConflict):
			return response.Conflict(c, "email or phone number already registered")
		default:
			return response.InternalServerError(c, "registration failed")
		}
	}
	return response.Created(c, result)
}

// CreateStaff is admin-only: onboards a doctor, receptionist, pharmacist, or another admin.
func (h *AuthHandler) CreateStaff(c *fiber.Ctx) error {
	var input services.CreateStaffInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	user, err := h.authSvc.CreateStaff(c.Context(), &input)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrConflict):
			return response.Conflict(c, "email already registered")
		default:
			return response.InternalServerError(c, "failed to create staff account")
		}
	}
	return response.Created(c, user)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input services.LoginInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	result, err := h.authSvc.Login(c.Context(), &input)
	if err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrInvalidCredentials):
			return response.Unauthorized(c, "invalid email, phone, or password")
		case pkgerrors.Is(err, pkgerrors.ErrForbidden):
			return response.Forbidden(c, "account is deactivated")
		default:
			return response.InternalServerError(c, "login failed")
		}
	}
	return response.OK(c, result)
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refreshToken" validate:"required"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&body); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	tokens, err := h.authSvc.RefreshTokens(c.Context(), body.RefreshToken)
	if err != nil {
		return response.Unauthorized(c, "invalid or expired refresh token")
	}
	return response.OK(c, tokens)
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := middleware.UserIDFromCtx(c)
	user, err := h.authSvc.GetUser(c.Context(), userID)
	if err != nil {
		return response.NotFound(c, "user not found")
	}
	return response.OK(c, user)
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID := middleware.UserIDFromCtx(c)

	var input services.ChangePasswordInput
	if err := c.BodyParser(&input); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if err := h.validator.Validate(&input); err != nil {
		return response.UnprocessableEntity(c, err.Error())
	}

	if err := h.authSvc.ChangePassword(c.Context(), userID, &input); err != nil {
		switch {
		case pkgerrors.Is(err, pkgerrors.ErrInvalidCredentials):
			return response.UnprocessableEntity(c, "current password is incorrect")
		default:
			return response.InternalServerError(c, "failed to change password")
		}
	}
	return response.OK(c, fiber.Map{"message": "password changed successfully"})
}
