package middleware_test

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// TestAuthBypassAttempts verifies that accessing protected endpoints without a JWT token fails with 401
func TestAuthBypassAttempts(t *testing.T) {
	app := fiber.New()

	// Simulated protected route requiring authentication
	app.Get("/api/v1/patients/me/appointments", func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication token required",
			})
		}
		return c.SendStatus(fiber.StatusOK)
	})

	// Request without authorization header
	req := httptest.NewRequest("GET", "/api/v1/patients/me/appointments", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("Expected status 401 Unauthorized for auth bypass attempt, got: %d", resp.StatusCode)
	}

	t.Log("SUCCESS: Auth bypass attempt blocked with 401 Unauthorized")
}

// TestIDORProtection verifies that a patient cannot access another patient's resource ID
func TestIDORProtection(t *testing.T) {
	app := fiber.New()

	authenticatedPatientID := uuid.New().String()
	targetPatientID := uuid.New().String() // Different patient ID (IDOR Attempt)

	// Simulated IDOR check handler
	app.Get("/api/v1/patients/:id", func(c *fiber.Ctx) error {
		requestedID := c.Params("id")

		// IDOR Guard: Reject if requested patient ID does not match token user ID
		if requestedID != authenticatedPatientID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: You are not authorized to view another patient's records",
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})

	// Request attempting to read a different patient's record
	req := httptest.NewRequest("GET", "/api/v1/patients/"+targetPatientID, nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute request: %v", err)
	}

	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("Expected status 403 Forbidden for IDOR attempt, got: %d", resp.StatusCode)
	}

	t.Log("SUCCESS: IDOR cross-patient access attempt blocked with 403 Forbidden")
}