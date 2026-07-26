package jobs

import (
	"context"
	"log"
	"time"

	"hospital-queue/internal/services"
)

// StartReminderWorker launches an automated background ticker job
// that regularly queries upcoming appointments scheduled N hours ahead and dispatches reminders.
func StartReminderWorker(apptSvc services.AppointmentService, checkInterval time.Duration) {
	ticker := time.NewTicker(checkInterval)

	go func() {
		log.Printf("[AUTOMATED CRON WORKER] Appointment Reminder Worker active (polling interval: %v)", checkInterval)

		// Run an initial check on startup
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		processUpcomingReminders(ctx, apptSvc)
		cancel()

		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			processUpcomingReminders(ctx, apptSvc)
			cancel()
		}
	}()
}

func processUpcomingReminders(ctx context.Context, apptSvc services.AppointmentService) {
	// Nil check safeguard to prevent nil pointer dereference
	if apptSvc == nil {
		log.Printf("[AUTOMATED CRON WORKER] Skipped process execution: appointment service is nil")
		return
	}

	now := time.Now().UTC()
	lookaheadEnd := now.Add(24 * time.Hour) // Look ahead 24 hours for upcoming visits

	log.Printf("[AUTOMATED CRON WORKER] Scanning upcoming appointments between %s and %s UTC...",
		now.Format("2006-01-02 15:04"), lookaheadEnd.Format("2006-01-02 15:04"))

	// Fetch upcoming appointments for the date range
	appointments, _, err := apptSvc.ListForDateRange(ctx, now, lookaheadEnd, 1, 100)
	if err != nil {
		log.Printf("[AUTOMATED CRON WORKER ERROR] Failed to query upcoming appointments: %v", err)
		return
	}

	remindedCount := 0
	for _, appt := range appointments {
		// Send automated SMS & Email reminders
		if err := apptSvc.SendReminder(ctx, appt.ID); err == nil {
			remindedCount++
		}
	}

	if remindedCount > 0 {
		log.Printf("[AUTOMATED CRON WORKER SUCCESS] Dispatched %d automated appointment reminders!", remindedCount)
	}
}