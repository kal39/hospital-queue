package routes

import (
	"hospital-queue/internal/api/handlers"
	"hospital-queue/internal/api/middleware"
	"hospital-queue/internal/models"
	"hospital-queue/pkg/jwt"

	"github.com/gofiber/fiber/v2"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Handlers struct {
	Auth        *handlers.AuthHandler
	Doctor      *handlers.DoctorHandler
	Patient     *handlers.PatientHandler
	Appointment *handlers.AppointmentHandler
	Queue       *handlers.QueueHandler
	Pharmacy    *handlers.PharmacyHandler
	Admin       *handlers.AdminHandler
}

func Register(app *fiber.App, h *Handlers, jwtManager *jwt.Manager) {
	app.Use(recover.New())
	app.Use(fiberlogger.New(fiberlogger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api/v1")
	auth := api.Group("/auth")

	staffOnly := string(models.RoleAdmin)
	frontDesk := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleReceptionist))
	clinicalStaff := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDoctor), string(models.RoleReceptionist))
	pharmacyStaff := middleware.RequireRole(string(models.RoleAdmin), string(models.RolePharmacist))
	adminOnly := middleware.RequireRole(staffOnly)

	auth.Post("/register", h.Auth.RegisterPatient)
	auth.Post("/login", h.Auth.Login)
	auth.Post("/refresh", h.Auth.Refresh)
	auth.Get("/me", middleware.Auth(jwtManager), h.Auth.Me)
	auth.Put("/password", middleware.Auth(jwtManager), h.Auth.ChangePassword)
	auth.Post("/staff", middleware.Auth(jwtManager), adminOnly, h.Auth.CreateStaff)

	protected := api.Group("", middleware.Auth(jwtManager))

	// Patient portal — the logged-in patient's own data.
	patientPortal := protected.Group("/patients/me")
	patientPortal.Get("/", h.Patient.Me)
	patientPortal.Put("/", h.Patient.UpdateMe)
	patientPortal.Post("/appointments", h.Appointment.Book)
	patientPortal.Get("/appointments", h.Appointment.MyAppointments)

	// Patient records — front desk / clinical staff lookups.
	patients := protected.Group("/patients", frontDesk)
	patients.Get("/", h.Patient.List)
	patients.Get("/:id", h.Patient.Get)

	// Doctors and their schedules.
	doctors := protected.Group("/doctors")
	doctors.Get("/", h.Doctor.List)
	doctors.Get("/:id", h.Doctor.Get)
	doctors.Get("/:id/slots", h.Doctor.AvailableSlots)
	doctors.Get("/:id/schedule", h.Doctor.GetSchedule)
	doctors.Post("/:id/schedule", clinicalStaff, h.Doctor.AddSchedule)
	doctors.Delete("/:id/schedule/:scheduleId", clinicalStaff, h.Doctor.RemoveSchedule)

	// Appointment booking + management (reception/doctor side).
	appts := protected.Group("/appointments", clinicalStaff)
	appts.Get("/", h.Appointment.List)
	appts.Get("/:id", h.Appointment.Get)
	appts.Get("/doctor/:doctorId", h.Appointment.ListByDoctor)
	appts.Put("/:id/status", h.Appointment.UpdateStatus)
	appts.Delete("/:id", h.Appointment.Cancel)
	appts.Post("/:id/remind", h.Appointment.SendReminder)

	// Queue number management.
	queue := protected.Group("/queue", clinicalStaff)
	queue.Get("/doctor/:doctorId", h.Queue.ListToday)
	queue.Post("/doctor/:doctorId/call-next", h.Queue.CallNext)
	queue.Put("/:id/status", h.Queue.UpdateStatus)

	// Pharmacy management — stock control is pharmacist/admin only, but a
	// doctor writes the prescription itself during a consult.
	pharmacy := protected.Group("/pharmacy")
	pharmacy.Get("/medications", pharmacyStaff, h.Pharmacy.ListMedications)
	pharmacy.Get("/medications/low-stock", pharmacyStaff, h.Pharmacy.ListLowStock)
	pharmacy.Post("/medications", pharmacyStaff, h.Pharmacy.CreateMedication)
	pharmacy.Put("/medications/:id/stock", pharmacyStaff, h.Pharmacy.AdjustStock)
	pharmacy.Post("/prescriptions", clinicalStaff, h.Pharmacy.CreatePrescription)
	pharmacy.Get("/prescriptions/pending", pharmacyStaff, h.Pharmacy.ListPendingPrescriptions)
	pharmacy.Post("/prescriptions/:id/dispense", pharmacyStaff, h.Pharmacy.DispensePrescription)

	// Admin dashboard.
	admin := protected.Group("/admin", adminOnly)
	admin.Get("/dashboard", h.Admin.Dashboard)
}
