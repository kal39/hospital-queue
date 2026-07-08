# Hospital Queue — Full Project Documentation

> Hospital queue & appointment system: booking, doctor schedules, live queue numbers, a patient portal, SMS/email reminders, pharmacy management, and an admin dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Roles](#roles)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Frontend Structure](#frontend-structure)
8. [Backend Structure](#backend-structure)
9. [Getting Started](#getting-started)
10. [Environment Variables](#environment-variables)
11. [Status & Roadmap](#status--roadmap)

---

## Overview

Hospital Queue replaces paper sign-in sheets and long physical queues with:

- Patient self-service appointment booking (patient portal)
- Doctor weekly schedules with computed available slots
- A sequential daily queue number per doctor, callable in order ("call next")
- Reception/clinical staff tools to check in, update, and cancel appointments
- SMS + email appointment reminders (console-logged in dev, pluggable provider in prod)
- Pharmacy: medication stock, prescriptions written by doctors, dispensing by pharmacists
- An admin dashboard with daily counts (doctors, patients, today's appointments, low stock, pending prescriptions)

### Key Design Principles

- **Role-based access**: a single `User`/`Role` model (`admin`, `doctor`, `receptionist`, `pharmacist`, `patient`) gates every route via middleware, rather than separate auth systems per user type
- **Queue numbers are derived, not manual**: booking an appointment automatically issues the next sequential ticket number for that doctor + day
- **Clean architecture**: backend uses handler → service → repository separation, same as the other Go/Fiber projects in this workspace
- **Type-safe**: full TypeScript on the frontend, strongly-typed Go on the backend

---

## Architecture

```
┌─────────────────┐     HTTPS/JSON      ┌──────────────────────┐
│  Next.js 16     │ ──────────────────▶ │  Golang Fiber API    │
│  (App Router)   │                     │  /api/v1             │
│  Port 3000      │ ◀────────────────── │  Port 8080           │
└─────────────────┘                     └──────────┬───────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │   PostgreSQL 16   │
                                           │   Port 5432       │
                                           └───────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| TanStack Query | Server state management + caching |
| Zustand | Client state (auth, UI) |
| Axios | HTTP client with JWT refresh interceptor |

### Backend

| Technology | Purpose |
|---|---|
| Go 1.22 | Language |
| Fiber v2 | HTTP framework |
| GORM | ORM |
| PostgreSQL 16 | Primary database |
| golang-jwt v5 | JWT access + refresh tokens |
| bcrypt | Password hashing (cost=12) |
| Viper | Config from `.env` |
| zerolog | Structured logging |
| go-playground/validator | Request validation |
| UUID | Primary keys |

---

## Roles

| Role | Can do |
|---|---|
| `patient` | Register, manage own profile, book/view own appointments |
| `receptionist` | Look up patients, manage appointments/queue |
| `doctor` | Manage own schedule, view/update their appointments and queue, write prescriptions |
| `pharmacist` | Manage medication stock, dispense prescriptions |
| `admin` | Everything above, plus onboard staff and view the dashboard |

---

## Database Schema

### `users`

```sql
id                 UUID PRIMARY KEY DEFAULT gen_random_uuid()
email              VARCHAR(255) UNIQUE
phone              VARCHAR(20) UNIQUE
password_hash      VARCHAR NOT NULL
first_name         VARCHAR(100) NOT NULL
last_name          VARCHAR(100) NOT NULL
role               VARCHAR(20) NOT NULL   -- admin | doctor | receptionist | pharmacist | patient
is_active          BOOLEAN NOT NULL DEFAULT TRUE
email_verified_at  TIMESTAMP
phone_verified_at  TIMESTAMP
created_at         TIMESTAMP
updated_at         TIMESTAMP
deleted_at         TIMESTAMP   -- soft delete
```

### `doctors` / `doctor_schedules`

```sql
-- doctors
id           UUID PRIMARY KEY
user_id      UUID UNIQUE NOT NULL REFERENCES users(id)
specialty    VARCHAR(100) NOT NULL
license_no   VARCHAR(50) NOT NULL
bio          TEXT
room_number  VARCHAR(20)

-- doctor_schedules (weekly recurring availability)
id            UUID PRIMARY KEY
doctor_id     UUID NOT NULL REFERENCES doctors(id)
weekday       INT NOT NULL CHECK (weekday BETWEEN 0 AND 6)   -- 0=Sunday
start_time    VARCHAR(5) NOT NULL   -- "09:00"
end_time      VARCHAR(5) NOT NULL   -- "17:00"
slot_minutes  INT NOT NULL DEFAULT 15
is_active     BOOLEAN NOT NULL DEFAULT TRUE
```

### `patients`

```sql
id                 UUID PRIMARY KEY
user_id            UUID UNIQUE NOT NULL REFERENCES users(id)
medical_record_no  VARCHAR(20) UNIQUE NOT NULL
date_of_birth      DATE
gender             VARCHAR(10)   -- male | female | other
address            VARCHAR(255)
emergency_contact  VARCHAR(100)
blood_type         VARCHAR(5)
```

### `appointments`

```sql
id                UUID PRIMARY KEY
patient_id        UUID NOT NULL REFERENCES patients(id)
doctor_id         UUID NOT NULL REFERENCES doctors(id)
scheduled_at      TIMESTAMP NOT NULL
duration_minutes  INT NOT NULL DEFAULT 15
status            VARCHAR(20) NOT NULL  -- scheduled|confirmed|checked_in|in_progress|completed|cancelled|no_show
reason            VARCHAR(255)
notes             TEXT
reminder_sent_at  TIMESTAMP
```

### `queue_tickets`

```sql
id              UUID PRIMARY KEY
appointment_id  UUID UNIQUE NOT NULL REFERENCES appointments(id)
doctor_id       UUID NOT NULL REFERENCES doctors(id)
queue_date      DATE NOT NULL
number          INT NOT NULL          -- sequential per doctor per day
status          VARCHAR(20) NOT NULL  -- waiting|called|serving|done|skipped
called_at       TIMESTAMP
```

### `medications` / `prescriptions` / `prescription_items`

```sql
-- medications
id             UUID PRIMARY KEY
name           VARCHAR(150) NOT NULL
description    TEXT
unit           VARCHAR(20) NOT NULL   -- tablet | ml | capsule ...
stock_qty      INT NOT NULL DEFAULT 0
reorder_level  INT NOT NULL DEFAULT 10
price_cents    INT NOT NULL DEFAULT 0

-- prescriptions
id              UUID PRIMARY KEY
appointment_id  UUID NOT NULL REFERENCES appointments(id)
patient_id      UUID NOT NULL REFERENCES patients(id)
doctor_id       UUID NOT NULL REFERENCES doctors(id)
status          VARCHAR(20) NOT NULL  -- pending | dispensed | cancelled
notes           TEXT

-- prescription_items
id               UUID PRIMARY KEY
prescription_id  UUID NOT NULL REFERENCES prescriptions(id)
medication_id    UUID NOT NULL REFERENCES medications(id)
dosage           VARCHAR(100) NOT NULL
quantity         INT NOT NULL
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. Authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register as a patient |
| POST | `/auth/login` | — | Login (email or phone), returns token pair |
| POST | `/auth/refresh` | — | Refresh access token |
| GET | `/auth/me` | ✓ | Current user profile |
| PUT | `/auth/password` | ✓ | Change password |
| POST | `/auth/staff` | admin | Onboard a doctor/receptionist/pharmacist/admin |

### Patient portal

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/patients/me` | patient | Own profile |
| PUT | `/patients/me` | patient | Update own profile |
| POST | `/patients/me/appointments` | patient | Book an appointment |
| GET | `/patients/me/appointments` | patient | Own appointment history |
| GET | `/patients` | front desk | Look up patients |
| GET | `/patients/:id` | front desk | Get a patient record |

### Doctors & schedules

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/doctors` | ✓ | List doctors |
| GET | `/doctors/:id` | ✓ | Get a doctor |
| GET | `/doctors/:id/slots?date=` | ✓ | Computed available booking slots |
| GET | `/doctors/:id/schedule` | ✓ | Weekly schedule |
| POST | `/doctors/:id/schedule` | clinical staff | Add a schedule block |
| DELETE | `/doctors/:id/schedule/:scheduleId` | clinical staff | Remove a schedule block |

### Appointments (staff side)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/appointments?from=&to=` | clinical staff | List by date range |
| GET | `/appointments/:id` | clinical staff | Get one |
| GET | `/appointments/doctor/:doctorId?date=` | clinical staff | A doctor's day |
| PUT | `/appointments/:id/status` | clinical staff | Update status |
| DELETE | `/appointments/:id` | clinical staff | Cancel |
| POST | `/appointments/:id/remind` | clinical staff | Send SMS/email reminder now |

### Queue

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/queue/doctor/:doctorId` | clinical staff | Today's queue for a doctor |
| POST | `/queue/doctor/:doctorId/call-next` | clinical staff | Call the next waiting patient |
| PUT | `/queue/:id/status` | clinical staff | Update a ticket's status |

### Pharmacy

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/pharmacy/medications` | pharmacy staff | List medications |
| GET | `/pharmacy/medications/low-stock` | pharmacy staff | Low-stock alert list |
| POST | `/pharmacy/medications` | pharmacy staff | Add a medication |
| PUT | `/pharmacy/medications/:id/stock` | pharmacy staff | Adjust stock (+/-) |
| POST | `/pharmacy/prescriptions` | clinical staff | Doctor writes a prescription |
| GET | `/pharmacy/prescriptions/pending` | pharmacy staff | Pending prescriptions |
| POST | `/pharmacy/prescriptions/:id/dispense` | pharmacy staff | Dispense (deducts stock) |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | admin | Doctor/patient counts, today's appointments, low stock, pending prescriptions |

---

## Frontend Structure

```
frontend/
├── app/                        Next.js App Router pages (not yet built out beyond the default scaffold)
├── components/
│   ├── layout/                 (empty — nav/sidebar go here)
│   └── ui/                     (empty — shared UI primitives go here)
├── lib/
│   ├── api/
│   │   ├── client.ts           Axios client with JWT interceptor + refresh
│   │   └── auth.ts             Register/login/me API calls
│   ├── hooks/                  (empty)
│   └── utils.ts                cn()
├── providers/
│   └── query-provider.tsx      TanStack Query provider
├── store/
│   ├── auth-store.ts           Zustand auth store (persisted)
│   └── ui-store.ts             Zustand UI store
└── types/
    └── index.ts                Shared TypeScript types (User, Doctor, Patient, Appointment, QueueTicket, Medication, Prescription)
```

## Backend Structure

```
backend/
├── cmd/server/main.go          Entry point: wires everything + graceful shutdown
├── internal/
│   ├── config/config.go        Viper-based config loader
│   ├── models/                 GORM models (user, doctor, patient, appointment, queue, pharmacy)
│   ├── repository/             Data access layer
│   ├── services/               Business logic (auth, doctor, appointment, queue, pharmacy)
│   └── api/
│       ├── handlers/           HTTP handlers
│       ├── middleware/         JWT auth + role-guard middleware
│       └── routes/routes.go    Route registration
├── pkg/
│   ├── response/                Consistent JSON response helpers
│   ├── errors/                  Sentinel errors
│   ├── jwt/                     Access/refresh token manager
│   ├── mailer/                  Email sending (dev: logs to console)
│   ├── sms/                     SMS sending (dev: logs to console; wire a real provider)
│   ├── password/                bcrypt hash/verify
│   └── validator/               go-playground/validator wrapper
├── go.mod / go.sum
├── .env.example
├── Makefile
├── Dockerfile / docker-compose.yml
└── railway.toml / render.yaml
```

---

## Getting Started

### Prerequisites

- Go 1.22+, Node.js 20+, PostgreSQL 16
- Docker (optional, for Postgres)

### Backend

```bash
cd backend
cp .env.example .env      # fill in JWT secrets
make docker-up             # starts Postgres
make dev                    # hot reload
# Health check: http://localhost:8080/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment mode |
| `APP_PORT` | `8080` | HTTP server port |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | PostgreSQL connection |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | — | **Required**, 32+ chars |
| `JWT_ACCESS_EXPIRY_MINUTES` | `15` | Access token TTL |
| `JWT_REFRESH_EXPIRY_DAYS` | `30` | Refresh token TTL |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_EXPIRY_SECONDS` | `100` / `60` | Rate limiting |
| `SMTP_*` | — | Email reminders (blank = log to console) |
| `SMS_ACCOUNT_SID` / `SMS_AUTH_TOKEN` / `SMS_FROM_NUMBER` | — | SMS reminders (blank = log to console) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## Status & Roadmap

### Built

- [x] Backend folder structure + full domain layer (models/repositories/services/handlers/routes)
- [x] Role-based auth (register patient, admin onboards staff, login, refresh, change password)
- [x] Appointment booking with overlap checking + automatic queue ticket issuance
- [x] Doctor weekly schedule + computed available slots
- [x] Queue call-next / status flow
- [x] Pharmacy: medication stock, prescriptions, dispensing (deducts stock)
- [x] Admin dashboard stats endpoint
- [x] SMS/email reminder plumbing (console-logged in dev)
- [x] Frontend scaffold (Next.js, Tailwind, TanStack Query, Zustand, Axios client with token refresh)

### Not yet built

- [ ] **Backend hasn't been compiled/run yet** — `go mod tidy` needs to finish successfully (last attempt hit a network error)
- [ ] Frontend pages/UI — only the default scaffold exists, no actual screens (login, booking calendar, queue display, pharmacy dashboard, etc.)
- [ ] Real SMS provider wiring (Twilio/Africa's Talking — currently a `pkg/sms` stub that logs)
- [ ] Automated tests (backend + frontend)
- [ ] Seed data / demo doctors & schedules
- [ ] Deployment: not yet deployed anywhere

---

*Go Fiber + Next.js 16 · Role-based hospital operations*
