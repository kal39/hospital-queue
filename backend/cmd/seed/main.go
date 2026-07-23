package main

import (
	"fmt"
	"log"
	"time"

	"hospital-queue/internal/config"
	"hospital-queue/internal/models"
	"hospital-queue/pkg/password"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Load Configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// 2. Connect to local PostgreSQL
	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	fmt.Println("Connected to database successfully. Preparing to seed...")

	//ctx := context.Background()

	// 3. Clear existing transaction/ticket tables to prevent duplicate key violations on fresh seed runs
	_ = db.Exec("TRUNCATE TABLE queue_tickets CASCADE")
	_ = db.Exec("TRUNCATE TABLE appointments CASCADE")
	_ = db.Exec("TRUNCATE TABLE prescription_items CASCADE")
	_ = db.Exec("TRUNCATE TABLE prescriptions CASCADE")
	_ = db.Exec("TRUNCATE TABLE medications CASCADE")
	_ = db.Exec("TRUNCATE TABLE patients CASCADE")
	_ = db.Exec("TRUNCATE TABLE doctors CASCADE")
	_ = db.Exec("TRUNCATE TABLE users CASCADE")

	// 4. Generate hashed password for all seed accounts
	defaultHash, err := password.Hash("password123")
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	// 5. Seed Patients
	patientUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "Eleanor",
		LastName:     "Fitzgerald",
		PasswordHash: defaultHash,
		Role:         "patient",
		IsActive:     true,
	}
	emailPat := "eleanor.fitzgerald@example.com"
	patientUser.Email = &emailPat
	phonePat := "+1 555-991-00"
	patientUser.Phone = &phonePat
	assertNoError(db.Create(patientUser).Error)

	patient := &models.Patient{
		ID:               uuid.New(),
		UserID:           patientUser.ID,
		MedicalRecordNo:  "MRN-88299100",
		Gender:           "F",
		Address:          "742 Evergreen Terrace, Sector 4, Springfield",
		EmergencyContact: "Arthur Fitzgerald (Husband) +1 555-991-11",
	}
	assertNoError(db.Create(patient).Error)

	// 6. Seed Doctors
	// Dr. Sarah Jenkins (Cardiology, Room 402)
	doc1User := &models.User{
		ID:           uuid.New(),
		FirstName:    "Sarah",
		LastName:     "Jenkins",
		PasswordHash: defaultHash,
		Role:         "doctor",
		IsActive:     true,
	}
	emailDoc1 := "sarah.jenkins@hospital.com"
	doc1User.Email = &emailDoc1
	assertNoError(db.Create(doc1User).Error)

	doctor1 := &models.Doctor{
		ID:         uuid.New(),
		UserID:     doc1User.ID,
		Specialty:  "Cardiology",
		LicenseNo:  "LIC-JENKINS-402",
		RoomNumber: "402",
		Bio:        "Senior Cardiologist specializing in non-invasive diagnostic techniques and patient-first medicine.",
	}
	assertNoError(db.Create(doctor1).Error)

	// Dr. Michael Chen (Neurologist, Room 405)
	doc2User := &models.User{
		ID:           uuid.New(),
		FirstName:    "Michael",
		LastName:     "Chen",
		PasswordHash: defaultHash,
		Role:         "doctor",
		IsActive:     true,
	}
	emailDoc2 := "michael.chen@hospital.com"
	doc2User.Email = &emailDoc2
	assertNoError(db.Create(doc2User).Error)

	doctor2 := &models.Doctor{
		ID:         uuid.New(),
		UserID:     doc2User.ID,
		Specialty:  "Neurology",
		LicenseNo:  "LIC-CHEN-405",
		RoomNumber: "405",
		Bio:        "Cognitive Neurologist focusing on headache and diagnostic neurophysiology.",
	}
	assertNoError(db.Create(doctor2).Error)

	// 7. Seed Staff Users (Admin, Receptionist, Pharmacist)
	adminUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "System",
		LastName:     "Administrator",
		PasswordHash: defaultHash,
		Role:         "admin",
		IsActive:     true,
	}
	emailAdmin := "admin@hospital.com"
	adminUser.Email = &emailAdmin
	assertNoError(db.Create(adminUser).Error)

	receptionUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "Margaret",
		LastName:     "Hamilton",
		PasswordHash: defaultHash,
		Role:         "receptionist",
		IsActive:     true,
	}
	emailRecep := "frontdesk@hospital.com"
	receptionUser.Email = &emailRecep
	assertNoError(db.Create(receptionUser).Error)

	pharmacistUser := &models.User{
		ID:           uuid.New(),
		FirstName:    "Phil",
		LastName:     "Pharmacist",
		PasswordHash: defaultHash,
		Role:         "pharmacist",
		IsActive:     true,
	}
	emailPharm := "pharmacy@hospital.com"
	pharmacistUser.Email = &emailPharm
	assertNoError(db.Create(pharmacistUser).Error)

	// 8. Seed Medication Stock Inventory (Matching Frontend Values Exactly)
	medications := []models.Medication{
		{
			ID:           uuid.New(),
			Name:         "Insulin Aspart",
			Description:  "Fast-acting insulin analogue used for diabetes management. Ref: INS-402",
			Unit:         "Vial",
			StockQty:     12, // Matches low stock alert!
			ReorderLevel: 20,
			PriceCents:   4500,
		},
		{
			ID:           uuid.New(),
			Name:         "Metformin 500mg",
			Description:  "First-line medication for type 2 diabetes. Ref: MET-105",
			Unit:         "Tabs",
			StockQty:     145,
			ReorderLevel: 30,
			PriceCents:   1250,
		},
		{
			ID:           uuid.New(),
			Name:         "Paracetamol 500mg",
			Description:  "Analgesic and antipyretic. Ref: PAR-202",
			Unit:         "Tabs",
			StockQty:     1240,
			ReorderLevel: 100,
			PriceCents:   500,
		},
		{
			ID:           uuid.New(),
			Name:         "Ibuprofen 400mg",
			Description:  "Nonsteroidal anti-inflammatory drug (NSAID). Ref: IBU-301",
			Unit:         "Caps",
			StockQty:     850,
			ReorderLevel: 50,
			PriceCents:   800,
		},
		{
			ID:           uuid.New(),
			Name:         "Salbutamol Inhaler",
			Description:  "Bronchodilator providing short-acting relief from asthma. Ref: SAL-112",
			Unit:         "Unit",
			StockQty:     28,
			ReorderLevel: 10,
			PriceCents:   2200,
		},
	}

	for _, med := range medications {
		assertNoError(db.Create(&med).Error)
	}

	// 9. Seed Mock Active Queue and Appointments for Today
	// General consultation appointment for Eleanor with James Wilson (or Dr. Jenkins as backup)
	apptToday := &models.Appointment{
		ID:              uuid.New(),
		PatientID:       patient.ID,
		DoctorID:        doctor1.ID,
		ScheduledAt:     time.Now().Truncate(24 * time.Hour).Add(10 * time.Hour), // 10:00 AM Today
		DurationMinutes: 15,
		Status:          models.AppointmentScheduled,
		Reason:          "General consultation follow-up",
	}
	assertNoError(db.Create(apptToday).Error)

	ticketToday := &models.QueueTicket{
		ID:            uuid.New(),
		AppointmentID: apptToday.ID,
		DoctorID:      doctor1.ID,
		QueueDate:     todayTruncated(),
		Number:        1,
		Status:        models.QueueWaiting,
	}
	assertNoError(db.Create(ticketToday).Error)

	fmt.Println("====================================================")
	fmt.Println("Database seeded with mock demo data successfully!")
	fmt.Println("Demo Patient Logins:")
	fmt.Println("  - Email: eleanor.fitzgerald@example.com | Pass: password123")
	fmt.Println("Demo Doctor Logins:")
	fmt.Println("  - Email: sarah.jenkins@hospital.com     | Pass: password123")
	fmt.Println("  - Email: michael.chen@hospital.com     | Pass: password123")
	fmt.Println("Demo Staff Logins:")
	fmt.Println("  - Admin: admin@hospital.com             | Pass: password123")
	fmt.Println("  - Reception: frontdesk@hospital.com     | Pass: password123")
	fmt.Println("  - Pharmacy: pharmacy@hospital.com       | Pass: password123")
	fmt.Println("====================================================")
}

func assertNoError(err error) {
	if err != nil {
		log.Fatalf("seeding failed during execution: %v", err)
	}
}

func todayTruncated() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
}
