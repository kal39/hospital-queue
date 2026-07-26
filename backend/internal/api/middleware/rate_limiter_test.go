package middleware_test

import (
	"net/http/httptest"
	"testing"

	"hospital-queue/internal/api/middleware"

	"github.com/gofiber/fiber/v2"
)

func TestStrictRateLimiter(t *testing.T) {
	app := fiber.New()
	app.Post("/api/v1/appointments", middleware.StrictLimiter(), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// 1. Send 5 allowed requests
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("POST", "/api/v1/appointments", nil)
		resp, err := app.Test(req)
		if err != nil || resp.StatusCode != fiber.StatusOK {
			t.Fatalf("Expected request %d to succeed, got status: %d", i+1, resp.StatusCode)
		}
	}

	// 2. 6th request MUST trigger HTTP 429 Too Many Requests
	req := httptest.NewRequest("POST", "/api/v1/appointments", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to execute 6th request: %v", err)
	}

	if resp.StatusCode != fiber.StatusTooManyRequests {
		t.Fatalf("Expected status 429 Too Many Requests on 6th booking attempt, got: %d", resp.StatusCode)
	}

	t.Log("SUCCESS: Strict rate limiter correctly blocked 6th booking attempt with HTTP 429!")
}