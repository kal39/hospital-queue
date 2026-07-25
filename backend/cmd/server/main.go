// cmd/server/main.go
package main

import (
	"fmt"
	"log"
	"strings"

	"hospital-queue/internal/api/handlers"
	"hospital-queue/internal/api/routes"
	"hospital-queue/internal/config"
	"hospital-queue/internal/database"
	"hospital-queue/internal/repository"
	"hospital-queue/internal/services"
	"hospital-queue/pkg/jwt"
	"hospital-queue/pkg/mailer"
	"hospital-queue/pkg/sms"
	"hospital-queue/pkg/validator"

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

	// 2. Run Versioned SQL Migrations (Production-Safe)
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

	// 3. Establish Database Connection (PostgreSQL with GORM)
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Set connection pool parameters
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxOpenConns(cfg.DB.MaxOpenConns)
		sqlDB.SetMaxIdleConns(cfg.DB.MaxIdleConns)
		sqlDB.SetConnMaxLifetime(cfg.DB.ConnMaxLifetime)
	}

	// 4. Initialize Shared Utility Packages (pkg/)
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

	// 5. Initialize Data Repositories (internal/repository)
	userRepo := repository.NewUserRepository(db)
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	apptRepo := repository.NewAppointmentRepository(db)
	queueRepo := repository.NewQueueRepository(db)
	medicationRepo := repository.NewMedicationRepository(db)
	prescriptionRepo := repository.NewPrescriptionRepository(db)

	// 6. Initialize Services (internal/services)
	authSvc := services.NewAuthService(userRepo, patientRepo, doctorRepo, jwtManager)
	apptSvc := services.NewAppointmentService(apptRepo, queueRepo, mailClient, smsClient)
	doctorSvc := services.NewDoctorService(doctorRepo, apptRepo)
	pharmacySvc := services.NewPharmacyService(medicationRepo, prescriptionRepo)
	queueSvc := services.NewQueueService(queueRepo, apptRepo, smsClient)

	// 7. Initialize Handlers (internal/api/handlers)
	h := &routes.Handlers{
		Auth:        handlers.NewAuthHandler(authSvc, v),
		Doctor:      handlers.NewDoctorHandler(doctorSvc, v),
		Patient:     handlers.NewPatientHandler(patientRepo, v),
		Appointment: handlers.NewAppointmentHandler(apptSvc, patientRepo, v),
		Queue:       handlers.NewQueueHandler(queueSvc),
		Pharmacy:    handlers.NewPharmacyHandler(pharmacySvc, v),
		Admin:       handlers.NewAdminHandler(doctorRepo, patientRepo, apptRepo, medicationRepo, prescriptionRepo),
	}

	// 8. Initialize Fiber Web App
	app := fiber.New()

	// Enforce HSTS (HTTP Strict Transport Security) and Security Headers
	app.Use(func(c *fiber.Ctx) error {
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		return c.Next()
	})

	// Safely clean CORS origins to prevent Fiber panic when AllowCredentials is true
	corsOrigins := strings.Join(cfg.CORS.Origins, ",")
	if corsOrigins == "" || corsOrigins == "*" {
		corsOrigins = "http://localhost:3000,http://localhost:5173,https://hospital-queue-1yd1.onrender.com,https://hospital-queue-frontend-a6wc.onrender.com"
	}

	// Enable CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Serve the browsable OpenAPI specification statically
	app.Static("/docs", "./openapi.yaml")

	// 9. Register Handlers to Routes
	routes.Register(app, h, jwtManager)

	// 10. Start Server
	serverAddr := fmt.Sprintf(":%d", cfg.App.Port)
	fmt.Printf("Starting HospitalQueue server on port %d in %s mode...\n", cfg.App.Port, cfg.App.Env)
	if err := app.Listen(serverAddr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
