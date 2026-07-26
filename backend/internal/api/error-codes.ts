// lib/api/error-codes.ts

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  FORBIDDEN_RESOURCE: "FORBIDDEN_RESOURCE",
  APPOINTMENT_CONFLICT: "APPOINTMENT_CONFLICT",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

/**
 * Extracts machine-readable error code from Axios response
 */
export function getErrorCode(error: any): string {
  return error?.response?.data?.code || "UNKNOWN_ERROR";
}