# Hospital Queue — Backend

Go Fiber API for appointment booking, doctor schedules, queue numbers, patient portal, SMS/email reminders, pharmacy management, and the admin dashboard.

## Stack

- [Fiber v2](https://gofiber.io/) — HTTP framework
- [GORM](https://gorm.io/) + PostgreSQL — ORM / database
- JWT access + refresh tokens
- [Viper](https://github.com/spf13/viper) — config from `.env`

## Structure

```
cmd/server/          entrypoint (main.go)
internal/
  api/handlers/       HTTP handlers
  api/middleware/      auth + role-guard middleware
  api/routes/          route registration
  config/              env config loading
  models/              GORM models
  repository/          data access layer
  services/            business logic
pkg/
  errors/       shared app error types
  jwt/          access/refresh token issuing + validation
  mailer/       email sending (dev: logs to console)
  sms/          SMS sending (dev: logs to console)
  password/     bcrypt hashing
  response/     JSON response envelope helpers
  validator/    struct validation
```

## Getting started

```bash
cp .env.example .env   # then fill in JWT secrets etc.
make docker-up          # starts Postgres
make dev                 # starts the API with hot reload (air)
```

The API listens on `:8080` by default. Health check: `GET /health`.

## Useful commands

| Command            | Description                          |
|---------------------|---------------------------------------|
| `make dev`          | run with hot reload                   |
| `make build`        | build a binary to `./bin`             |
| `make run`          | build + run                           |
| `make test`         | run tests with coverage               |
| `make lint`         | run golangci-lint                     |
| `make tidy`         | `go mod tidy`                         |
| `make docker-up`    | start Postgres via docker compose     |
| `make docker-down`  | stop docker compose services          |

Deployment configs are included for both [Railway](railway.toml) and [Render](render.yaml).
