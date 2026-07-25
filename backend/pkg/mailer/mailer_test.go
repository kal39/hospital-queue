package mailer_test

import (
	"testing"
	"hospital-queue/pkg/mailer"
)

func TestMailerSendMock(t *testing.T) {
	m := mailer.New("", 587, "", "", "noreply@hospitalqueue.com")
	err := m.Send("patient@example.com", "Test", "Body")
	if err != nil {
		t.Fatalf("error: %v", err)
	}
}