package audit_test

import (
	"testing"
	"hospital-queue/pkg/audit"
	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

func TestLogPatientAccess(t *testing.T) {
	app := fiber.New()
	ctx := app.AcquireCtx(&fasthttp.RequestCtx{})
	defer app.ReleaseCtx(ctx)

	ctx.Locals("userID", "doc-101")
	ctx.Locals("userRole", "DOCTOR")

	audit.LogPatientAccess(ctx, "PATIENT_RECORD_VIEWED", "patient-202")
}