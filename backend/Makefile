.PHONY: dev build run test lint clean docker-up docker-down tidy

APP_NAME=hospital-queue
BUILD_DIR=./bin

dev:
	@which air > /dev/null 2>&1 || go install github.com/air-verse/air@latest
	air

build:
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(BUILD_DIR)/$(APP_NAME) ./cmd/server

run: build
	$(BUILD_DIR)/$(APP_NAME)

test:
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint:
	@which golangci-lint > /dev/null 2>&1 || go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	golangci-lint run ./...

tidy:
	go mod tidy

clean:
	rm -rf $(BUILD_DIR) coverage.out coverage.html

docker-up:
	docker compose up -d postgres

docker-down:
	docker compose down

.DEFAULT_GOAL := dev
