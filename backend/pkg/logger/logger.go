// pkg/logger/logger.go
package logger

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

var Log zerolog.Logger

// InitLogger sets up structured JSON output to stdout for Cloud Log Aggregators (Render / Datadog / Loki)
func InitLogger(env string) {
	zerolog.TimeFieldFormat = time.RFC3339

	if strings.ToLower(env) == "development" {
		// Pretty console logger for local terminal dev
		Log = zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}).
			With().
			Timestamp().
			Caller().
			Logger()
	} else {
		// Structured JSON stdout stream for Cloud Aggregators (Render Log Explorer / Datadog / Loki)
		Log = zerolog.New(os.Stdout).
			With().
			Timestamp().
			Str("service", "hospital-queue-api").
			Str("environment", env).
			Logger()
	}
}

// LogRequest emits structured JSON log events for HTTP requests
func LogRequest(status int, method, path, ip string, duration time.Duration) {
	event := Log.Info()
	if status >= 500 {
		event = Log.Error()
	} else if status >= 400 {
		event = Log.Warn()
	}

	event.
		Int("status", status).
		Str("method", method).
		Str("path", path).
		Str("client_ip", ip).
		Int64("duration_ms", duration.Milliseconds()).
		Msg("HTTP Request Dispatched")
}
