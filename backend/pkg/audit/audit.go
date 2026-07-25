// pkg/mailer/mailer.go
package mailer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"strings"
	"time"
)

// Mailer manages transactional email delivery via API and SMTP fallback
type Mailer struct {
	Host       string
	Port       int
	Username   string
	Password   string
	From       string
	httpClient *http.Client
}

// ResendEmailRequest defines the JSON payload for transactional email APIs
type ResendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

// New initializes a new Mailer instance
func New(host string, port int, username, password, from string) *Mailer {
	return &Mailer{
		Host:     strings.TrimSpace(host),
		Port:     port,
		Username: strings.TrimSpace(username),
		Password: strings.TrimSpace(password),
		From:     strings.TrimSpace(from),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Send dispatches an email using Transactional API (Resend/Postmark), with local mock fallback
func (m *Mailer) Send(to, subject, htmlBody string) error {
	// 1. Transactional API Mode (Resend API key starts with "re_" or Host contains "resend")
	if strings.HasPrefix(m.Password, "re_") || strings.Contains(strings.ToLower(m.Host), "resend") {
		return m.sendViaTransactionalAPI(to, subject, htmlBody)
	}

	// 2. Dev Mock Fallback (If no credentials provided in local environment)
	if m.Host == "" || m.Password == "" {
		log.Printf("[MAILER DEV MOCK] To: %s | Subject: %s | Body length: %d bytes", to, subject, len(htmlBody))
		return nil
	}

	// 3. Raw SMTP Fallback (for local SMTP servers / Mailtrap)
	auth := smtp.PlainAuth("", m.Username, m.Password, m.Host)
	addr := fmt.Sprintf("%s:%d", m.Host, m.Port)

	msg := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n\r\n%s", m.From, to, subject, htmlBody))

	err := smtp.SendMail(addr, auth, m.From, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send SMTP email: %w", err)
	}

	log.Printf("[MAILER SMTP SUCCESS] Email sent to %s via SMTP", to)
	return nil
}

// sendViaTransactionalAPI dispatches emails via HTTPS API to prevent spam flags in production
func (m *Mailer) sendViaTransactionalAPI(to, subject, htmlBody string) error {
	fromAddress := m.From
	if fromAddress == "" {
		fromAddress = "HospitalQueue <onboarding@resend.dev>"
	}

	payload := ResendEmailRequest{
		From:    fromAddress,
		To:      []string{to},
		Subject: subject,
		HTML:    htmlBody,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal transactional email JSON: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create transactional mail request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", m.Password))
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to dispatch email via Transactional API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errResp map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("transactional API returned status %d: %v", resp.StatusCode, errResp)
	}

	log.Printf("[MAILER TRANSACTIONAL SUCCESS] Email dispatched to %s via Transactional API", to)
	return nil
}

// SendEmail alias method for backwards compatibility
func (m *Mailer) SendEmail(to, subject, htmlBody string) error {
	return m.Send(to, subject, htmlBody)
}

// SendAppointmentReminder formats and sends an appointment reminder email
func (m *Mailer) SendAppointmentReminder(to, timeStr, doctorName string) error {
	subject := "Appointment Reminder - HospitalQueue"
	htmlBody := fmt.Sprintf("<h2>Appointment Reminder</h2><p>You have an upcoming appointment with Dr. <strong>%s</strong> scheduled for <strong>%s</strong>.</p>", doctorName, timeStr)
	return m.Send(to, subject, htmlBody)
}