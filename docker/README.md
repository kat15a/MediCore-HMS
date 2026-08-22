# Docker Deployment Guide

## Architecture

```
                 ┌─────────────────────────────────────────┐
   Browser  ───▶ │  frontend (nginx, port 8081 → 80)        │
                 │   • serves the built React app           │
                 │   • proxies /api/*     → backend:8080    │
                 │   • proxies /uploads/* → backend:8080    │
                 └───────────────────┬───────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │  backend (Spring Boot, port 8080)        │
                 │   • REST API under /api                  │
                 │   • runs Flyway migrations on startup    │
                 └───────────────────┬───────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │  mysql (MySQL 8, port 3306)              │
                 │   • persisted via the hms-mysql-data      │
                 │     named volume                         │
                 └─────────────────────────────────────────┘
```

All three services share the `hms-network` bridge network and reach each other by
service name (`mysql`, `backend`, `frontend`) — only `frontend` and `backend` ports
are published to the host by default (`8081` and `8080`); `mysql`'s `3306` is also
published for local `psql`-style debugging but can be removed for production.

## Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# edit .env — at minimum set JWT_SECRET, DB passwords, and an AI provider key

# 2. Build and start everything
docker compose up -d --build

# 3. Watch the backend come up (runs Flyway migrations, seeds roles/departments/admin)
docker compose logs -f backend
```

- Frontend: http://localhost:8081
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- Default admin login: `admin@hms.local` / `Admin@123` (change immediately)

## Common Operations

```bash
# Rebuild a single service after code changes
docker compose up -d --build backend

# Tail logs
docker compose logs -f backend frontend

# Stop everything (keeps volumes — data survives)
docker compose down

# Stop and wipe all data (fresh database next start)
docker compose down -v

# Open a shell in the backend container
docker compose exec backend sh
```

## Health Checks

Both `backend` and `frontend` define container `HEALTHCHECK`s:
- Backend: `GET /api/actuator/health`
- Frontend: `GET /health` (nginx, returns `200 ok` without touching the SPA)

`docker compose ps` shows `healthy`/`unhealthy` status. `frontend` won't start
routing traffic to a backend that hasn't reported healthy — see `depends_on:
condition: service_healthy` in `docker-compose.yml`.

## Production Notes

- Set `SPRING_PROFILES_ACTIVE=prod` (already the default in `.env.example`) — this
  trims SQL logging and lowers log verbosity (`application-prod.yml`).
- Generate a real `JWT_SECRET`: `openssl rand -base64 48`.
- Set real SMTP credentials (`MAIL_USERNAME`/`MAIL_PASSWORD`) or email verification
  and password reset links will silently fail to send (the app logs a warning and
  continues rather than breaking registration — see `EmailServiceImpl`).
- Put a real TLS-terminating reverse proxy (or a cloud load balancer) in front of
  the `frontend` container in production; this `nginx.conf` only handles the SPA
  and API proxy, not TLS.
- The `hms-mysql-data` and `hms-backend-uploads` named volumes are the only
  persisted state — back them up (or point `DB_HOST`/`FILE_STORAGE_DIR` at managed
  services) before treating this as a real production deployment.
