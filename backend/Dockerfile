FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY . .

# Dynamically locate and build cmd/server regardless of context
RUN if [ -d "./cmd/server" ]; then \
        CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server; \
    else \
        CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./backend/cmd/server; \
    fi

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /bin/server ./server

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./server"]