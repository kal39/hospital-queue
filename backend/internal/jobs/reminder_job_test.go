package jobs_test

import (
	"testing"
	"time"
	"hospital-queue/internal/jobs"
)

func TestReminderWorkerInitialization(t *testing.T) {
	// Verify background ticker worker launches without panicking
	jobs.StartReminderWorker(nil, 100*time.Millisecond)
	time.Sleep(50 * time.Millisecond)
}
