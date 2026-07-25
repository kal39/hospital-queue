# 📡 Uptime Monitoring & Error Spike Alerting Architecture

This document specifies the health check probes, uptime monitoring schedules, and automated incident alert thresholds for **HospitalQueue**.

---

## 🏥 1. System Health Check Endpoint

The Go backend exposes an unauthenticated health check probe endpoint designed for cloud monitoring services (UptimeRobot, BetterStack, Datadog, Render Probes):

* **Endpoint:** `GET /health` and `GET /api/v1/health`
* **Response Status:** `200 OK`
* **Response Payload:**
  ```json
  {
    "service": "hospital-queue-api",
    "status": "healthy"
  }