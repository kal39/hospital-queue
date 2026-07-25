package pagination_test

import (
	"hospital-queue/pkg/pagination"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

func TestParseFilterParams(t *testing.T) {
	app := fiber.New()
	ctx := app.AcquireCtx(&fasthttp.RequestCtx{})
	defer app.ReleaseCtx(ctx)

	// Simulate incoming query params: ?status=checked_in&doctor_id=doc-101&page=2&limit=20&sort_by=scheduled_at&order=asc
	ctx.Request().URI().SetQueryString("status=checked_in&doctor_id=doc-101&page=2&limit=20&sort_by=scheduled_at&order=asc")

	params := pagination.ParseFilterParams(ctx)

	if params.Status != "checked_in" {
		t.Errorf("Expected status 'checked_in', got: %s", params.Status)
	}
	if params.DoctorID != "doc-101" {
		t.Errorf("Expected doctor_id 'doc-101', got: %s", params.DoctorID)
	}
	if params.Page != 2 || params.Limit != 20 {
		t.Errorf("Expected page 2 and limit 20, got: page %d limit %d", params.Page, params.Limit)
	}
	if params.SortBy != "scheduled_at" || params.Order != "asc" {
		t.Errorf("Expected sort_by 'scheduled_at' asc, got: %s %s", params.SortBy, params.Order)
	}
}
