FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY . .

# Automatically locate main.go anywhere in the directory tree and build it
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server $(find . -name "main.go" -exec dirname {} \; | head -n 1)

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /bin/server ./server

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

CMD ["./server"]