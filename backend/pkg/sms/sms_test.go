// pkg/sms/sms_test.go
package sms_test

import (
	"hospital-queue/pkg/sms"
	"testing"
)

func TestSMSSendMock(t *testing.T) {
	sender := sms.New("", "", "")

	err := sender.Send("+15551234567", "Test HospitalQueue appointment reminder")
	if err != nil {
		t.Fatalf("Expected mock SMS to succeed without error, got: %v", err)
	}
}
