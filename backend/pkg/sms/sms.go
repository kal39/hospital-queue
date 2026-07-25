// pkg/sms/sms.go
package sms

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Sender handles sending SMS messages via Twilio
type Sender struct {
	AccountSID string
	AuthToken  string
	FromNumber string
	httpClient *http.Client
}

// New creates a new SMS Sender instance
func New(accountSID, authToken, fromNumber string) *Sender {
	return &Sender{
		AccountSID: strings.TrimSpace(accountSID),
		AuthToken:  strings.TrimSpace(authToken),
		FromNumber: strings.TrimSpace(fromNumber),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Send dispatches an SMS message using Twilio REST API
func (s *Sender) Send(to string, message string) error {
	// Fallback mock mode when credentials are missing
	if s.AccountSID == "" || s.AuthToken == "" || s.FromNumber == "" {
		log.Printf("[SMS DEV MOCK] To: %s | Message: %s", to, message)
		return nil
	}

	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", s.AccountSID)

	data := url.Values{}
	data.Set("To", to)
	data.Set("From", s.FromNumber)
	data.Set("Body", message)

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create Twilio request: %w", err)
	}

	req.SetBasicAuth(s.AccountSID, s.AuthToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send SMS via Twilio: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var twilioError map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&twilioError)
		return fmt.Errorf("twilio API error (status %d): %v", resp.StatusCode, twilioError)
	}

	log.Printf("[SMS SUCCESS] Message dispatched to %s via Twilio", to)
	return nil
}

// SendSMS is an alias method to support alternative method calls
func (s *Sender) SendSMS(to string, message string) error {
	return s.Send(to, message)
}
