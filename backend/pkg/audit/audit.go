package audit

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

// LogEntry defines a HIPAA-compliant medical record access log entry
type LogEntry struct {
	Timestamp       string `json:"timestamp"`
	Action          string `json:"action"`
	ActorID         string `json:"actor_id"`
	ActorRole       string `json:"actor_role"`
	TargetPatientID string `json:"target_patient_id,omitempty"`
	ResourcePath    string `json:"resource_path"`
	IPAddress       string `json:"ip_address"`
	UserAgent       string `json:"user_agent"`
}

// LogPatientAccess records structured audit logs whenever patient health records are viewed
func LogPatientAccess(c *fiber.Ctx, action, targetPatientID string) {
	userID := c.Locals("userID")
	userRole := c.Locals("userRole")

	actorIDStr := ""
	if userID != nil {
		actorIDStr = userID.(string)
	}

	actorRoleStr := ""
	if userRole != nil {
		actorRoleStr = userRole.(string)
	}

	entry := LogEntry{
		Timestamp:       time.Now().UTC().Format(time.RFC3339),
		Action:          action,
		ActorID:         actorIDStr,
		ActorRole:       actorRoleStr,
		TargetPatientID: targetPatientID,
		ResourcePath:    c.Path(),
		IPAddress:       c.IP(),
		UserAgent:       c.Get("User-Agent"),
	}

	jsonLog, err := json.Marshal(entry)
	if err == nil {
		log.Printf("[PHI ACCESS AUDIT LOG] %s", string(jsonLog))
	}
}