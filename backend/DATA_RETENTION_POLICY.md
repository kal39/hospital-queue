# 🔒 HospitalQueue - Data Retention, Access Control & Privacy Architecture

This document defines the data retention schedules, Role-Based Access Control (RBAC) permissions, and data deletion request handling for the **HospitalQueue** platform.

---

## 📅 1. Record Retention Schedule

| Record Category | Retention Period | Enforcement & Storage Mechanism |
| :--- | :--- | :--- |
| **Patient Clinical Records** | 10 Years post-last visit | Immutable encrypted storage (Medical Legal Requirement) |
| **Prescriptions & Medications** | 10 Years | GORM Soft-delete (`deleted_at`) + Audit archive |
| **Appointment Records** | 7 Years | Soft-delete (`deleted_at`) |
| **Queue Tickets & Real-Time Logs** | 1 Year (365 Days) | Automated scheduled database purge |
| **System Security Audit Logs** | 7 Years | Append-only immutable log records |

---

## 🛡️ 2. Role-Based Access Control (RBAC) Matrix

| Data Resource | Patient | Doctor | Receptionist | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Own Medical Records** | Read Only | Read (Assigned) | ❌ Denied | Read/Manage |
| **Patient Directory (GET /patients)** | ❌ Denied | Read | Read | Full Access |
| **Appointment Management** | Read (Own) | Read (Assigned) | Read/Update All | Full Access |
| **Prescriptions (POST /pharmacy)** | Read (Own) | Create/Read | Read (Dispense) | Full Access |
| **Audit Logs** | ❌ Denied | ❌ Denied | ❌ Denied | Read Only |

---

## 🗑️ 3. Deletion Requests & Erasure Protocol (Soft-Delete)

Healthcare statutory compliance prohibits immediate hard-deletion of active clinical records. Deletion requests are processed via a two-tier soft-delete and PII anonymization pipeline:

1. **Soft Delete (`gorm.DeletedAt`):** When a user requests account deletion, the system marks `deleted_at = NOW()`. Authentication tokens are invalidated immediately.
2. **PII Anonymization:** Personal Identifiable Information (Name, Phone Number, Email) is scrambled (e.g. `anonymized_user_xxxx`), leaving non-identifiable aggregated clinical metrics intact.
3. **Statutory Hard Purge:** After the 10-year statutory retention period elapses, an automated background job executes a hard purge from PostgreSQL storage.