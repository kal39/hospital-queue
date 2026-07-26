# 📊 Zerolog Structured JSON Logging & Aggregation Architecture

This document details the structured JSON logging configuration, cloud log shipping pipeline, and incident query procedures for **HospitalQueue**.

---

## 🪵 1. Structured JSON Log Format (`zerolog`)

In staging and production environments, Zerolog emits clean single-line JSON log events directly to `stdout`. Cloud log forwarders (Render Log Streamer, Datadog Log Agent, Grafana Loki) parse these fields automatically.

```json
{
  "level": "error",
  "time": "2026-07-25T18:00:00Z",
  "service": "hospital-queue-api",
  "environment": "staging",
  "status": 500,
  "method": "POST",
  "path": "/api/v1/pharmacy/prescriptions",
  "client_ip": "197.156.88.10",
  "duration_ms": 120,
  "message": "HTTP Request Dispatched"
}