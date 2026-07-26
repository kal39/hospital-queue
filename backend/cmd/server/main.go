// cmd/server/main.go
package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"hospital-queue/internal/api/handlers"
	"hospital-queue/internal/api/routes"
	"hospital-queue/internal/config"
	"hospital-queue/internal/database"
	"hospital-queue/internal/jobs"
	"hospital-queue/internal/repository"
	"hospital-queue/internal/services"
	"hospital-queue/pkg/jwt"
	"hospital-queue/pkg/mailer"
	"hospital-queue/pkg/sms"
	"hospital-queue/pkg/validator"

	"github.com/getsentry/sentry-go"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Load Configurations
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// 2. Initialize Sentry Exception Tracking
	sentryDSN := os.Getenv("SENTRY_DSN")
	if sentryDSN != "" {
		err := sentry.Init(sentry.ClientOptions{
			Dsn:              sentryDSN,
			Environment:      cfg.App.Env,
			TracesSampleRate: 1.0,
		})
		if err == nil {
			defer sentry.Flush(2 * time.Second)
			log.Println("[SENTRY] Go Backend Unhandled Exception Tracking Active 🛡️")
		}
	} else {
		log.Println("[SENTRY MOCK] SENTRY_DSN not set. Unhandled exceptions will log to console.")
	}

	// 3. Run Versioned SQL Migrations
	fmt.Println("Running versioned database migrations...")
	pgURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.DB.User, cfg.DB.Password, cfg.DB.Host, cfg.DB.Port, cfg.DB.Name, cfg.DB.SSLMode,
	)
	err = database.RunMigrations(pgURL)
	if err != nil {
		log.Fatalf("failed to run database migrations: %v", err)
	}
	fmt.Println("Database migrations completed successfully.")

	// 4. Establish Database Connection
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxOpenConns(cfg.DB.MaxOpenConns)
		sqlDB.SetMaxIdleConns(cfg.DB.MaxIdleConns)
		sqlDB.SetConnMaxLifetime(cfg.DB.ConnMaxLifetime)
	}

	// 5. Initialize Shared Utilities
	jwtManager := jwt.NewManager(
		cfg.JWT.AccessSecret,
		cfg.JWT.RefreshSecret,
		cfg.JWT.AccessExpiryMinutes,
		cfg.JWT.RefreshExpiryDays,
	)
	mailClient := mailer.New(
		cfg.SMTP.Host,
		cfg.SMTP.Port,
		cfg.SMTP.Username,
		cfg.SMTP.Password,
		cfg.SMTP.From,
	)
	smsClient := sms.New(
		cfg.SMS.AccountSID,
		cfg.SMS.AuthToken,
		cfg.SMS.FromNumber,
	)
	v := validator.New()

	// 6. Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	apptRepo := repository.NewAppointmentRepository(db)
	queueRepo := repository.NewQueueRepository(db)
	medicationRepo := repository.NewMedicationRepository(db)
	prescriptionRepo := repository.NewPrescriptionRepository(db)

	// 7. Initialize Services
	authSvc := services.NewAuthService(userRepo, patientRepo, doctorRepo, jwtManager)
	apptSvc := services.NewAppointmentService(apptRepo, queueRepo, mailClient, smsClient)
	doctorSvc := services.NewDoctorService(doctorRepo, apptRepo)
	pharmacySvc := services.NewPharmacyService(medicationRepo, prescriptionRepo)
	queueSvc := services.NewQueueService(queueRepo, apptRepo, smsClient)

	// Launch Automated Background Appointment Reminder Cron Worker (polls every 15 minutes)
	jobs.StartReminderWorker(apptSvc, 15*time.Minute)

	// 8. Initialize Handlers
	h := &routes.Handlers{
		Auth:        handlers.NewAuthHandler(authSvc, v),
		Doctor:      handlers.NewDoctorHandler(doctorSvc, v),
		Patient:     handlers.NewPatientHandler(patientRepo, v),
		Appointment: handlers.NewAppointmentHandler(apptSvc, patientRepo, v),
		Queue:       handlers.NewQueueHandler(queueSvc),
		Pharmacy:    handlers.NewPharmacyHandler(pharmacySvc, v),
		Admin:       handlers.NewAdminHandler(doctorRepo, patientRepo, apptRepo, medicationRepo, prescriptionRepo),
	}

	// 9. Initialize Fiber App
	app := fiber.New()

	// Global Exception Handling Middleware
	app.Use(func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				panicErr := fmt.Sprintf("unhandled server panic: %v", r)
				if sentryDSN != "" {
					sentry.CaptureMessage(panicErr)
				}
				log.Printf("[SENTRY CRITICAL EXCEPTION RECOVERED] %v", panicErr)
				_ = c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "An unexpected server error occurred.",
				})
			}
		}()
		return c.Next()
	})

	// Health Endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"service": "hospital-queue-api",
			"status":  "healthy",
		})
	})

	// Security Headers & HSTS
	app.Use(func(c *fiber.Ctx) error {
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		return c.Next()
	})

	// CORS Setup
	corsOrigins := strings.Join(cfg.CORS.Origins, ",")
	if corsOrigins == "" || corsOrigins == "*" {
		corsOrigins = "http://localhost:3000,http://localhost:5173,https://hospital-queue-1yd1.onrender.com,https://hospital-queue-frontend-a6wc.onrender.com"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	app.Static("/docs", "./openapi.yaml")

	// 10. Register Routes
	routes.Register(app, h, jwtManager)

	// 11. Start Server
	serverAddr := fmt.Sprintf(":%d", cfg.App.Port)
	fmt.Printf("Starting HospitalQueue server on port %d in %s mode...\n", cfg.App.Port, cfg.App.Env)
	if err := app.Listen(serverAddr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
