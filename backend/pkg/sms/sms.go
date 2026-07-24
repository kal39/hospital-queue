// backend/pkg/sms/sms.go
package sms

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Sender interface defines the contract for sending SMS notifications
type Sender interface {
	SendSMS(to string, message string) error
}

type client struct {
	accountSID string
	authToken  string
	fromNumber string
	httpClient *http.Client
}

// New creates a new SMS Sender instance configured with Twilio credentials
func New(accountSID, authToken, fromNumber string) Sender {
	return &client{
		accountSID: strings.TrimSpace(accountSID),
		authToken:  strings.TrimSpace(authToken),
		fromNumber: strings.TrimSpace(fromNumber),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendSMS delivers an SMS message using Twilio or falls back to standard log output if credentials are unset
func (s *client) SendSMS(to string, message string) error {
	// Fallback for local development/staging when Twilio credentials are not provided
	if s.accountSID == "" || s.authToken == "" || s.fromNumber == "" {
		log.Printf("[SMS MOCK LOG] To: %s | Message: %s\n", to, message)
		return nil
	}

	// Construct Twilio API Endpoint
	endpoint := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", s.accountSID)

	// Prepare URL Form-encoded request body
	formData := url.Values{}
	formData.Set("To", to)
	formData.Set("From", s.fromNumber)
	formData.Set("Body", message)

	req, err := http.NewRequest("POST", endpoint, strings.NewReader(formData.Encode()))
	if err != nil {
		return fmt.Errorf("failed to construct twilio sms request: %w", err)
	}

	// Configure HTTP Basic Auth and Headers
	req.SetBasicAuth(s.accountSID, s.authToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	// Execute HTTP request to Twilio API
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to twilio API: %w", err)
	}
	defer resp.Body.Close()

	// Check response status code
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("twilio SMS API rejected request (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	log.Printf("[SMS DELIVERED] Twilio SMS successfully sent to %s", to)
	return nil
}
