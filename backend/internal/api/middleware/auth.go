package middleware

import (
	"hospital-queue/pkg/jwt"
	"hospital-queue/pkg/response"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const userIDKey = "userID"
const userEmailKey = "userEmail"
const userRoleKey = "userRole"

func Auth(jwtManager *jwt.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Unauthorized(c, "missing authorization header")
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return response.Unauthorized(c, "invalid authorization header format")
		}

		claims, err := jwtManager.ValidateAccess(parts[1])
		if err != nil {
			return response.Unauthorized(c, "invalid or expired token")
		}

		c.Locals(userIDKey, claims.UserID)
		c.Locals(userEmailKey, claims.Email)
		c.Locals(userRoleKey, claims.Role)

		return c.Next()
	}
}

// RequireRole restricts a route group to one or more roles (e.g. "admin", "doctor").
// Must run after Auth.
func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := UserRoleFromCtx(c)
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return response.Forbidden(c, "you do not have access to this resource")
	}
}

func UserIDFromCtx(c *fiber.Ctx) uuid.UUID {
	id, _ := c.Locals(userIDKey).(uuid.UUID)
	return id
}

func UserRoleFromCtx(c *fiber.Ctx) string {
	role, _ := c.Locals(userRoleKey).(string)
	return role
}
