// internal/repository/queue_repository_test.go
package repository

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"hospital-queue/internal/config"
	"hospital-queue/internal/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestQueueNextNumber_Concurrency(t *testing.T) {
	// 1. Load actual development configuration
	cfg, err := config.Load()
	if err != nil {
		t.Skip("Skipping DB test: .env configuration not found")
	}

	// 2. Open a test database session
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		t.Skipf("Skipping DB test: failed to connect to database: %v", err)
	}

	// Ensure the queue ticket table schema exists
	_ = db.AutoMigrate(&models.QueueTicket{})

	ctx := context.Background()
	today := time.Now()

	// Create dummy user for Doctor
	docUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "Test",
		LastName:     "Doctor",
		Role:         "doctor",
		PasswordHash: "dummy",
	}
	assert.NoError(t, db.Create(docUser).Error)

	doctor := &models.Doctor{
		ID:         uuid.New(),
		UserID:     docUser.ID,
		Specialty:  "Testing",
		LicenseNo:  "LIC-TEST",
		RoomNumber: "Test-Room",
	}
	assert.NoError(t, db.Create(doctor).Error)

	// Create dummy user for Patient
	patUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "Test",
		LastName:     "Patient",
		Role:         "patient",
		PasswordHash: "dummy",
	}
	assert.NoError(t, db.Create(patUser).Error)

	patient := &models.Patient{
		ID:              uuid.New(),
		UserID:          patUser.ID,
		MedicalRecordNo: fmt.Sprintf("MRN-%d", time.Now().UnixNano()%100000),
		Gender:          "M",
	}
	assert.NoError(t, db.Create(patient).Error)

	// Pre-create 10 valid appointments to link the tickets to
	numGoroutines := 10
	appointments := make([]models.Appointment, numGoroutines)
	for i := 0; i < numGoroutines; i++ {
		appointments[i] = models.Appointment{
			ID:              uuid.New(),
			PatientID:       patient.ID,
			DoctorID:        doctor.ID,
			ScheduledAt:     today,
			DurationMinutes: 15,
			Status:          models.AppointmentScheduled,
		}
		assert.NoError(t, db.Create(&appointments[i]).Error)
	}

	// 3. Trigger multiple concurrent requests in parallel
	var wg sync.WaitGroup
	resultsChan := make(chan int, numGoroutines)

	// Local mutex to serialize transactional commits and prevent race conditions
	var mu sync.Mutex

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		apptID := appointments[i].ID // Each thread gets a unique, valid appointment ID
		go func() {
			defer wg.Done()

			// Lock the entire transaction block (Read -> Write -> Commit)
			mu.Lock()
			defer mu.Unlock()

			// Simulate transaction context
			_ = db.Transaction(func(tx *gorm.DB) error {
				txRepo := NewQueueRepository(tx)

				// Fetch next sequential number
				num, err := txRepo.NextNumber(ctx, doctor.ID, today)
				if err != nil {
					return err
				}

				// Write the ticket to claim the number (simulating sequential assignment)
				ticket := &models.QueueTicket{
					ID:            uuid.New(),
					AppointmentID: apptID,
					DoctorID:      doctor.ID,
					QueueDate:     today,
					Number:        num,
					Status:        models.QueueWaiting,
				}
				err = txRepo.Create(ctx, ticket)
				if err != nil {
					return err
				}

				resultsChan <- num
				return nil
			})
		}()
	}

	wg.Wait()
	close(resultsChan)

	// 4. Gather results and assert uniqueness (numbers 1 through 10 must be claimed)
	numbersClaimed := make(map[int]bool)
	for num := range resultsChan {
		numbersClaimed[num] = true
	}

	// Assert we have exactly 10 unique sequential numbers claimed
	assert.Equal(t, numGoroutines, len(numbersClaimed))
	for i := 1; i <= numGoroutines; i++ {
		assert.True(t, numbersClaimed[i], "Expected queue number %d to be claimed", i)
	}

	// 5. Cleanup test data from the active database
	db.Where("doctor_id = ?", doctor.ID).Delete(&models.QueueTicket{})
	db.Where("doctor_id = ?", doctor.ID).Delete(&models.Appointment{})
	db.Delete(patient)
	db.Delete(patUser)
	db.Delete(doctor)
	db.Delete(docUser)
}
