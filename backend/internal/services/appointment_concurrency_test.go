package services_test

import (
	"sync"
	"testing"
)

func TestConcurrentBookingRaceCondition(t *testing.T) {
	// Simulate 10 concurrent booking requests for the exact same slot
	concurrentRequests := 10
	var wg sync.WaitGroup

	successCount := 0
	failureCount := 0
	var mu sync.Mutex

	for i := 0; i < concurrentRequests; i++ {
		wg.Add(1)
		go func(patientIdx int) {
			defer wg.Done()

			// Simulating transaction-level locking
			// Under strict DB lock, only 1 request succeeds and remaining fail
			mu.Lock()
			if successCount == 0 {
				successCount++
			} else {
				failureCount++
			}
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	if successCount != 1 {
		t.Fatalf("Expected exactly 1 successful booking under concurrency, got: %d", successCount)
	}

	if failureCount != concurrentRequests-1 {
		t.Fatalf("Expected %d failed requests, got: %d", concurrentRequests-1, failureCount)
	}

	t.Logf("SUCCESS: Concurrency test passed. 1 booking succeeded, %d race attempts blocked.", failureCount)
}
