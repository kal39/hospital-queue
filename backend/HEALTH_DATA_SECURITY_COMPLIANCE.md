# 🏥 Health Data Security, Encryption & Regulatory Compliance Report

This document specifies the database encryption mechanisms, Protected Health Information (PHI) access audit logging, and regulatory compliance frameworks enforced in **HospitalQueue**.

---

## 🔐 1. Encryption at Rest & In Transit

| Security Domain | Encryption Standard | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **Database Encryption at Rest** | AES-256 Bit Encryption | ✅ **ACTIVE** | Render Managed PostgreSQL uses transparent block-level storage encryption (AES-256) on underlying cloud disks. |
| **Transport Encryption (In Transit)** | TLS 1.3 / HTTPS (HSTS) | ✅ **ACTIVE** | Enforced HSTS headers (`max-age=31536000; includeSubDomains; preload`). |
| **Credential Encryption** | Bcrypt (Cost Factor 12) | ✅ **ACTIVE** | User passwords salted and hashed prior to database write operations. |

---

## 📜 2. PHI Access Audit Logging System (`pkg/audit`)

To satisfy HIPAA Audit Controls (§ 164.312(b)), every read access to patient health data (DOB, blood type, prescriptions) emits a structured JSON audit log entry containing:

* **Timestamp (UTC)**
* **Actor ID & Role** (Doctor / Receptionist / Admin ID)
* **Target Patient ID** (Whose medical profile was viewed)
* **API Endpoint Path & Client IP Address**

```json
{
  "timestamp": "2026-07-25T12:00:00Z",
  "action": "PATIENT_RECORD_VIEWED",
  "actor_id": "doc-101",
  "actor_role": "DOCTOR",
  "target_patient_id": "patient-202",
  "resource_path": "/api/v1/patients/patient-202",
  "ip_address": "197.156.88.10"
}