package logger_test

import (
	"hospital-queue/pkg/logger"
	"testing"
	"time"
)

func TestStructuredJSONLogger(t *testing.T) {
	logger.InitLogger("staging")
	logger.LogRequest(200, "GET", "/api/v1/doctors", "127.0.0.1", 15*time.Millisecond)
	logger.LogRequest(500, "POST", "/api/v1/pharmacy/prescriptions", "127.0.0.1", 120*time.Millisecond)
}
