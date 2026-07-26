package errors_test

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"hospital-queue/pkg/errors"

	"github.com/gofiber/fiber/v2"
)

func TestStructuredErrorResponse(t *testing.T) {
	app := fiber.New()

	app.Post("/api/v1/appointments", func(c *fiber.Ctx) error {
		return errors.SendError(c, fiber.StatusConflict, errors.ErrAppointmentConflict, "Selected appointment slot is no longer available.")
	})

	req := httptest.NewRequest("POST", "/api/v1/appointments", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if resp.StatusCode != fiber.StatusConflict {
		t.Fatalf("Expected status 409 Conflict, got: %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var errResp errors.ErrorResponse
	_ = json.Unmarshal(body, &errResp)

	if errResp.Code != errors.ErrAppointmentConflict {
		t.Fatalf("Expected error code 'APPOINTMENT_CONFLICT', got: %s", errResp.Code)
	}

	t.Logf("SUCCESS: Structured error envelope verified: Code='%s', Message='%s'", errResp.Code, errResp.Message)
}
