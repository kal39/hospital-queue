// internal/api/routes/routes_test.go
package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"hospital-queue/internal/api/handlers"
	"hospital-queue/internal/config"
	"hospital-queue/internal/models"
	"hospital-queue/internal/repository"
	"hospital-queue/internal/services"
	"hospital-queue/pkg/jwt"
	"hospital-queue/pkg/password"
	"hospital-queue/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestEndToEndHandlersAndRoleGuards(t *testing.T) {
	// 1. Load actual development configuration
	cfg, err := config.Load()
	if err != nil {
		t.Skip("Skipping E2E test: .env configuration not found")
	}

	// 2. Open a test database session
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		t.Skipf("Skipping E2E test: failed to connect to database: %v", err)
	}

	// Ensure schemas are up-to-date
	_ = db.AutoMigrate(&models.User{}, &models.Doctor{}, &models.Patient{}, &models.Appointment{}, &models.QueueTicket{})

	// 3. Initialize dependency tree
	jwtManager := jwt.NewManager(
		cfg.JWT.AccessSecret,
		cfg.JWT.RefreshSecret,
		cfg.JWT.AccessExpiryMinutes,
		cfg.JWT.RefreshExpiryDays,
	)
	v := validator.New()

	userRepo := repository.NewUserRepository(db)
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	apptRepo := repository.NewAppointmentRepository(db)
	queueRepo := repository.NewQueueRepository(db)
	medicationRepo := repository.NewMedicationRepository(db)
	prescriptionRepo := repository.NewPrescriptionRepository(db)

	authSvc := services.NewAuthService(userRepo, patientRepo, doctorRepo, jwtManager)
	apptSvc := services.NewAppointmentService(apptRepo, queueRepo, nil, nil)
	doctorSvc := services.NewDoctorService(doctorRepo, apptRepo)
	pharmacySvc := services.NewPharmacyService(medicationRepo, prescriptionRepo)
	queueSvc := services.NewQueueService(queueRepo, apptRepo, nil)

	h := &Handlers{
		Auth:        handlers.NewAuthHandler(authSvc, v),
		Doctor:      handlers.NewDoctorHandler(doctorSvc, v),
		Patient:     handlers.NewPatientHandler(patientRepo, v),
		Appointment: handlers.NewAppointmentHandler(apptSvc, patientRepo, v),
		Queue:       handlers.NewQueueHandler(queueSvc),
		Pharmacy:    handlers.NewPharmacyHandler(pharmacySvc, v),
		Admin:       handlers.NewAdminHandler(doctorRepo, patientRepo, apptRepo, medicationRepo, prescriptionRepo),
	}

	// 4. Initialize Fiber App and Register Routes
	app := fiber.New()
	Register(app, h, jwtManager)

	// Set up unique identifiers for clean database test records
	testEmail := fmt.Sprintf("test-patient-%d@example.com", time.Now().UnixNano()%100000)
	testPass := "password123"

	// ================= TEST CASE 1: Patient Self-Registration (POST /auth/register) =================
	t.Run("Patient Registration Success", func(t *testing.T) {
		regBody := map[string]interface{}{
			"firstName": "John",
			"lastName":  "Doe",
			"email":     testEmail,
			"password":  testPass,
			"gender":    "male",
		}
		jsonBody, _ := json.Marshal(regBody)

		req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode) // Corrected to expect 201 Created
	})

	// ================= TEST CASE 2: Patient Login & Token Generation (POST /auth/login) =================
	var patientToken string
	var patientID string
	t.Run("Patient Login Success", func(t *testing.T) {
		loginBody := map[string]interface{}{
			"identifier": testEmail,
			"password":   testPass,
		}
		jsonBody, _ := json.Marshal(loginBody)

		req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Parse the JWT token from response data envelope
		var res map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		data := res["data"].(map[string]interface{})
		tokens := data["tokens"].(map[string]interface{})
		userMap := data["user"].(map[string]interface{})

		patientToken = tokens["accessToken"].(string)
		patientID = userMap["id"].(string)
		assert.NotEmpty(t, patientToken)
	})

	// Set up a dummy Doctor in database for the booking test
	docPass, _ := password.Hash("password123")
	docUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "Test",
		LastName:     "Doctor",
		Role:         models.RoleDoctor,
		IsActive:     true,
		PasswordHash: docPass,
	}
	db.Create(docUser)

	doctor := &models.Doctor{
		ID:         uuid.New(),
		UserID:     docUser.ID,
		Specialty:  "Cardiology",
		LicenseNo:  "LIC-E2E-TEST",
		RoomNumber: "402",
	}
	db.Create(doctor)

	// ================= TEST CASE 3: Authorized Booking (POST /patients/me/appointments) =================
	t.Run("Patient Book Appointment Success", func(t *testing.T) {
		bookBody := map[string]interface{}{
			"doctorId":    doctor.ID.String(),
			"scheduledAt": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
			"reason":      "E2E Test Booking",
		}
		jsonBody, _ := json.Marshal(bookBody)

		req := httptest.NewRequest("POST", "/api/v1/patients/me/appointments", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", patientToken))

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode) // Corrected to expect 201 Created
	})

	// ================= TEST CASE 4: Role-Guard Rejection (POST /queue/doctor/:id/call-next) =================
	t.Run("Queue Call-Next - Block Patient (403 Forbidden)", func(t *testing.T) {
		req := httptest.NewRequest("POST", fmt.Sprintf("/api/v1/queue/doctor/%s/call-next", doctor.ID.String()), nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", patientToken))

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	// ================= TEST CASE 5: Role-Guard Success (POST /queue/doctor/:id/call-next) =================
	t.Run("Queue Call-Next - Allow Doctor (200 OK or 404 No Patients)", func(t *testing.T) {
		docTokens, _ := jwtManager.GeneratePair(docUser.ID, docUser.Identifier(), string(docUser.Role))

		req := httptest.NewRequest("POST", fmt.Sprintf("/api/v1/queue/doctor/%s/call-next", doctor.ID.String()), nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", docTokens.AccessToken))

		resp, err := app.Test(req, -1)
		assert.NoError(t, err)
		assert.NotEqual(t, http.StatusForbidden, resp.StatusCode)
		assert.NotEqual(t, http.StatusUnauthorized, resp.StatusCode)
	})

	// ================= CLEANUP =================
	db.Where("doctor_id = ?", doctor.ID).Delete(&models.QueueTicket{})
	db.Where("doctor_id = ?", doctor.ID).Delete(&models.Appointment{})
	db.Delete(doctor)
	db.Delete(docUser)

	patientUUID, _ := uuid.Parse(patientID)
	var patient models.Patient
	db.First(&patient, "user_id = ?", patientUUID)
	db.Delete(&patient)
	db.Delete(&models.User{ID: patientUUID})
}
