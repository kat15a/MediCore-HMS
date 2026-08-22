# Installation Guide

Detailed local setup instructions. For the condensed version, see the root `README.md`'s Quick Start;
for production, see `docs/DEPLOYMENT.md`.

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Java (JDK) | 21 | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 20+ | `node -version` |
| npm | 10+ (ships with Node 20) | `npm -version` |
| MySQL | 8.0+ | `mysql --version` |
| Docker + Compose (optional, for the Docker path) | latest | `docker compose version` |

## Option A — Docker (fastest, fewest moving parts)

Covered in the root `README.md` Quick Start and `docker/README.md` in full. Requires only Docker —
no local Java, Node, or MySQL installation at all.

## Option B — Running Everything Locally

### Step 1 — Database

```bash
# Log into MySQL as root (or any user with CREATE DATABASE / CREATE USER privileges)
mysql -u root -p
```

```sql
CREATE DATABASE hms_db;
CREATE USER 'hms_user'@'localhost' IDENTIFIED BY 'hms_password';
GRANT ALL PRIVILEGES ON hms_db.* TO 'hms_user'@'localhost';
FLUSH PRIVILEGES;
```

(Use a stronger password than `hms_password` for anything beyond local dev — this is just the
default that matches `backend/.env.example`.)

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` — at minimum:
- `DB_USERNAME` / `DB_PASSWORD` — match what you created in Step 1.
- `JWT_SECRET` — any long random string is fine for local dev (the placeholder in `.env.example` works).
- `AI_PROVIDER` + `GEMINI_API_KEY` or `OPENAI_API_KEY` — required only if you want the AI features
  (Symptom Checker, Report Summarizer, Prescription Explainer, Chatbot) to work; everything else
  runs fine without it.
- `MAIL_USERNAME` / `MAIL_PASSWORD` — optional for local dev. Without real SMTP credentials,
  verification/reset emails fail to send but are logged as a warning rather than blocking
  registration — you can grab the verification token directly from the `users` table
  (`email_verification_token` column) if you don't want to configure SMTP locally.

```bash
mvn spring-boot:run
```

On first run, Flyway creates the schema and seeds roles, departments, and the default admin account.
Confirm it's up:

```bash
curl http://localhost:8080/api/actuator/health
# {"status":"UP"}
```

Swagger UI: http://localhost:8080/api/swagger-ui.html — use the "Authorize" button with a JWT from
`POST /auth/login` to try protected endpoints directly.

### Step 3 — Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit http://localhost:5173. Vite's dev server proxies `/api/*` to `http://localhost:8080` (see
`vite.config.js`), so the frontend and backend talk to each other with no extra configuration.

### Step 4 — Log in

Default seeded admin: `admin@hms.local` / `Admin@123`. Change this password immediately
(Profile → Change Password once logged in).

To try the patient flow, register a new account from the landing page — you'll need either real
SMTP configured (Step 2) or to pull the verification token from the database directly to verify it.

## Troubleshooting

**`mvn spring-boot:run` fails with a connection error to MySQL**
Confirm MySQL is running (`sudo systemctl status mysql` / `brew services list`) and that
`DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD` in `backend/.env` match what you created in Step 1.

**Flyway complains about a checksum mismatch**
Someone (possibly a previous run of this guide) edited an already-applied migration file. Either
restore the original file content, or — for local dev only — drop and recreate the database
(`DROP DATABASE hms_db; CREATE DATABASE hms_db;`) so Flyway starts clean.

**Frontend shows network errors / can't reach the API**
Confirm the backend is actually running on port 8080 and that `frontend/.env`'s
`VITE_API_BASE_URL` points at it (default `http://localhost:8080/api` is correct for local dev).

**AI features return a 503 "AI service is temporarily unavailable"**
`AI_PROVIDER`'s matching API key isn't set, or is invalid. Check `backend/.env` — everything else in
the app works without it; only the four AI endpoints (`/ai/*`) need it.

**Port 5173 or 8080 already in use**
Something else is bound to that port. Stop it, or change `SERVER_PORT` (backend) / pass
`--port` to `vite` (frontend, or edit `frontend/vite.config.js`).
