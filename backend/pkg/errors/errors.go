// pkg/errors/errors.go
package errors

import (
	"errors"

	"github.com/gofiber/fiber/v2"
)

// Standard Error Variables for internal services
var (
	ErrValidation         = errors.New("validation failed")
	ErrInternalServer     = errors.New("internal server error")
	ErrNotFound           = errors.New("resource not found")
	ErrUnauthorized       = errors.New("unauthorized access")
	ErrForbidden          = errors.New("forbidden resource")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrTokenInvalid       = errors.New("token invalid or expired")
	ErrConflict           = errors.New("resource conflict")
)

// Is is a wrapper around standard library errors.Is
func Is(err, target error) bool {
	return errors.Is(err, target)
}

// As is a wrapper around standard library errors.As
func As(err error, target any) bool {
	return errors.As(err, target)
}

// Machine-readable error codes for API response envelope
const (
	ErrCodeInvalidCredentials  = "INVALID_CREDENTIALS"
	ErrCodeUnauthorized        = "UNAUTHORIZED_ACCESS"
	ErrCodeForbidden           = "FORBIDDEN_RESOURCE"
	ErrCodeAppointmentConflict = "APPOINTMENT_CONFLICT"
	ErrCodeValidationFailed    = "VALIDATION_FAILED"
	ErrCodeNotFound            = "RESOURCE_NOT_FOUND"
	ErrCodeRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrCodeInternalError       = "INTERNAL_SERVER_ERROR"
)

// ErrorResponse defines the structured JSON response envelope
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

// SendError formats and dispatches a machine-readable error response
func SendError(c *fiber.Ctx, status int, code, message string) error {
	return c.Status(status).JSON(ErrorResponse{
		Code:    code,
		Message: message,
		Status:  status,
	})
}