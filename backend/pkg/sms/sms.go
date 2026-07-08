package sms

import (
	"strconv"

	"github.com/rs/zerolog/log"
)

// Sender abstracts an SMS provider (Twilio, Africa's Talking, etc).
// The zero value logs messages to the console instead of sending them,
// which is enough for local dev — wire a real provider in New() once
// credentials exist.
type Sender struct {
	accountSID string
	authToken  string
	fromNumber string
	enabled    bool
}

func New(accountSID, authToken, fromNumber string) *Sender {
	return &Sender{
		accountSID: accountSID,
		authToken:  authToken,
		fromNumber: fromNumber,
		enabled:    accountSID != "" && authToken != "",
	}
}

func (s *Sender) SendAppointmentReminder(toPhone, patientName, doctorName, whenText string) error {
	body := "Hi " + patientName + ", reminder: appointment with " + doctorName + " on " + whenText + "."
	return s.send(toPhone, body)
}

func (s *Sender) SendQueueCalledNotice(toPhone string, queueNumber int) error {
	body := "You're being called now — queue number " + strconv.Itoa(queueNumber) + ". Please proceed to the doctor's room."
	return s.send(toPhone, body)
}

func (s *Sender) send(toPhone, body string) error {
	if !s.enabled {
		log.Info().Str("to", toPhone).Str("body", body).Msg("[dev] SMS (provider not configured)")
		return nil
	}
	// TODO: call the real provider's API (e.g. Twilio REST API) here.
	log.Info().Str("to", toPhone).Str("body", body).Msg("SMS sent")
	return nil
}
