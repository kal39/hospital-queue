package pagination

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// FilterParams defines standard parameters for filtering, sorting, and pagination
type FilterParams struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	Status    string `json:"status"`
	DoctorID  string `json:"doctor_id"`
	Search    string `json:"search"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	SortBy    string `json:"sort_by"`
	Order     string `json:"order"`
}

// ParseFilterParams parses and sanitizes incoming query parameters from Fiber Ctx
func ParseFilterParams(c *fiber.Ctx) FilterParams {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if limit < 1 || limit > 100 {
		limit = 10
	}

	sortBy := strings.TrimSpace(c.Query("sort_by", "created_at"))
	order := strings.ToLower(strings.TrimSpace(c.Query("order", "desc")))
	if order != "asc" && order != "desc" {
		order = "desc"
	}

	return FilterParams{
		Page:      page,
		Limit:     limit,
		Status:    strings.TrimSpace(c.Query("status")),
		DoctorID:  strings.TrimSpace(c.Query("doctor_id", c.Query("doctor"))),
		Search:    strings.TrimSpace(c.Query("search", c.Query("query"))),
		StartDate: strings.TrimSpace(c.Query("start_date")),
		EndDate:   strings.TrimSpace(c.Query("end_date")),
		SortBy:    sortBy,
		Order:     order,
	}
}

// ApplyGORMFilters attaches dynamic WHERE clauses, date ranges, sorting, and pagination
func ApplyGORMFilters(db *gorm.DB, params FilterParams) *gorm.DB {
	query := db

	if params.Status != "" {
		query = query.Where("LOWER(status) = ?", strings.ToLower(params.Status))
	}

	if params.DoctorID != "" {
		query = query.Where("doctor_id = ?", params.DoctorID)
	}

	if params.StartDate != "" {
		query = query.Where("created_at >= ? OR scheduled_at >= ?", params.StartDate, params.StartDate)
	}

	if params.EndDate != "" {
		query = query.Where("created_at <= ? OR scheduled_at <= ?", params.EndDate, params.EndDate)
	}

	orderClause := params.SortBy + " " + params.Order
	query = query.Order(orderClause)

	offset := (params.Page - 1) * params.Limit
	return query.Offset(offset).Limit(params.Limit)
}