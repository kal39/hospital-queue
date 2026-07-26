// pkg/errors/errors.go
package errors

import "github.com/gofiber/fiber/v2"

// Machine-readable standardized error codes
const (
	ErrInvalidCredentials  = "INVALID_CREDENTIALS"
	ErrUnauthorized        = "UNAUTHORIZED_ACCESS"
	ErrForbidden           = "FORBIDDEN_RESOURCE"
	ErrAppointmentConflict = "APPOINTMENT_CONFLICT"
	ErrValidationFailed    = "VALIDATION_FAILED"
	ErrNotFound            = "RESOURCE_NOT_FOUND"
	ErrRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrInternalError       = "INTERNAL_SERVER_ERROR"
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
