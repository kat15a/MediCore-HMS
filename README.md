# MediCore — AI Powered Hospital Management System

A full-stack hospital management platform with role-based dashboards (Admin, Doctor,
Receptionist, Patient), appointment scheduling, prescriptions, billing, lab reports,
and AI-assisted clinical tools (symptom checking, report summarization, prescription
explanations, hospital FAQ chatbot).

> **Build status:** This project is being generated module by module, in the order
> below. Modules completed so far are checked off.

## Module Build Order

- [x] 1. Project Setup
- [x] 2. Database Schema
- [x] 3. Spring Boot Backend (entities, repositories, services, controllers)
- [x] 4. JWT Authentication & Security
- [x] 5. React Frontend (shell, theme, auth flow, routing)
- [x] 6. CRUD Modules (Doctors, Patients, Appointments, Billing, etc.)
- [x] 7. AI Integration (Gemini/OpenAI)
- [x] 8. Testing (JUnit/Mockito)
- [x] 9. Docker
- [x] 10. Deployment

All ten modules are complete. See the Documentation section below for the full doc set.

## Tech Stack

| Layer      | Tech |
|------------|------|
| Frontend   | React 19, Vite, React Router, Axios, Material UI, Framer Motion, React Hook Form |
| Backend    | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, JWT, Hibernate, Maven |
| Database   | MySQL 8, Flyway migrations |
| AI         | Google Gemini API or OpenAI API (configurable via `AI_PROVIDER`) |
| Docs       | springdoc-openapi (Swagger UI) |
| Testing    | JUnit 5, Mockito |
| Deployment | Docker, Docker Compose |

## Folder Structure

```
hospital-management-system/
├── backend/                    # Spring Boot 3 / Java 21 API
│   ├── pom.xml
│   └── src/main/java/com/hospital/hms/
│       ├── controller/         # REST controllers
│       ├── service/            # Service interfaces
│       ├── service/impl/       # Service implementations
│       ├── repository/         # Spring Data JPA repositories
│       ├── entity/             # JPA entities
│       ├── dto/request|response/
│       ├── mapper/             # MapStruct mappers
│       ├── security/           # JWT filter, UserDetailsService, etc.
│       ├── config/             # SecurityConfig, CORS, OpenAPI, etc.
│       ├── exception/          # Global exception handling
│       ├── validation/         # Custom validators
│       ├── util/               # Helpers
│       ├── ai/                 # Gemini/OpenAI integration
│       ├── email/              # Email service (verification, reset password)
│       └── scheduler/          # Scheduled jobs (reminders, cleanup)
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/       # Flyway SQL migrations
├── frontend/                   # React 19 + Vite
│   └── src/
│       ├── pages/{landing,auth,admin,doctor,patient,receptionist,shared}
│       ├── components/{common,layout,charts,forms}
│       ├── features/{appointments,prescriptions,billing,ai,reports,notifications}
│       ├── services/           # Axios API clients
│       ├── context/            # Auth context, theme context
│       ├── hooks/
│       ├── routes/             # Role-based route guards
│       └── theme/
├── database/                   # ER diagram, schema docs
├── docker/                     # Dockerfiles, compose
└── docs/                       # Architecture, API docs, guides
```

## Prerequisites

- Java 21 (JDK)
- Node.js 20+
- MySQL 8+
- Maven 3.9+ (or use the included `mvnw` once added)

## Quick Start

### Option A — Docker (recommended)

```bash
cp .env.example .env   # fill in JWT_SECRET, DB passwords, AI provider key
docker compose up -d --build
```

Frontend: http://localhost:8081 · Backend: http://localhost:8080/api · Swagger:
http://localhost:8080/api/swagger-ui.html. See `docker/README.md` for the full guide
(architecture, health checks, common operations, production notes).

### Option B — Run locally without Docker

```bash
# 1. Database
mysql -u root -p -e "CREATE DATABASE hms_db;"

# 2. Backend
cd backend
cp .env.example .env   # fill in DB credentials, JWT secret, AI keys
mvn spring-boot:run

# 3. Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:8080/api`, Swagger UI at
`http://localhost:8080/api/swagger-ui.html`. Frontend runs at `http://localhost:5173`.

## Authentication Flow

- **Patients** self-register via `POST /auth/register` → account starts unverified → verification email
  is sent → `POST /auth/verify-email` activates the account → `POST /auth/login` issues an access token
  (15 min, JWT) and a refresh token (7 days, or 24h without "remember me"), both via `POST /auth/login`.
- **Doctors, Receptionists** are created directly by an Admin (`POST /doctors`, `POST /receptionists`),
  which provisions the linked `User` account pre-verified.
- Access tokens are short-lived JWTs carrying `userId`, `role`, and `fullName` claims; refresh tokens are
  opaque random strings stored server-side in `refresh_tokens`, so they can be revoked (`POST /auth/logout`)
  and are rotated on every `POST /auth/refresh` call.
- Forgot/reset password (`POST /auth/forgot-password`, `POST /auth/reset-password`) uses a 1-hour-expiry
  token; resetting a password revokes all of that user's existing refresh tokens.
- All protected endpoints expect `Authorization: Bearer <accessToken>`. Try it in Swagger UI via the
  "Authorize" button (JWT bearer scheme is pre-configured).

## AI Integration (Module 7)

The AI provider is fully swappable via one environment variable — `AI_PROVIDER=gemini` or
`AI_PROVIDER=openai` — with zero code changes. `com.hospital.hms.ai.AiProvider` is the only interface
the rest of the app depends on; `AiConfig` picks the concrete `GeminiAiProvider` or `OpenAiAiProvider`
bean at startup based on that setting. Both call their vendor's REST API directly via `WebClient` (no
vendor SDK dependency).

- **AI Symptom Checker** (`POST /ai/symptom-check`) — takes a free-text symptom description (+ optional
  age/gender/history), prompts the model to answer in strict JSON, and returns possible conditions, a
  recommended department (matched against the hospital's *actual* department list from the database, not
  hallucinated), an urgency level, suggested questions for the doctor, red-flag symptoms, and a fixed
  medical disclaimer the app controls (never trusted from the model).
- **Medical Report Summarizer** (`POST /ai/reports/summarize-text` and `/ai/reports/summarize-pdf`) —
  accepts pasted text or an uploaded PDF (text extracted server-side with iText7, no OCR/scanned-image
  support), returns a plain-language summary and a list of abnormal findings, and — if a `labReportId` is
  given — saves the summary onto that lab report so the patient sees it automatically on their Lab Reports
  page.
- **Prescription Explanation** (`GET /ai/prescriptions/{id}/explain`) — explains each medicine's purpose,
  side effects, dosage guidance, and precautions in plain language, saves the result onto the prescription
  (visible to the patient immediately after), and enforces ownership (a patient can only explain their own
  prescriptions; a doctor only their own).
- **Hospital Chatbot** (`POST /ai/chat`) — answers FAQs about hours, departments, doctor counts, and
  booking, grounded with real data pulled from the database each call; explicitly redirects clinical
  questions to the Symptom Checker rather than attempting to diagnose.

All AI responses are requested as strict JSON and parsed defensively (markdown code-fence stripping,
missing-field fallbacks) so a slightly malformed model response degrades gracefully instead of crashing
the request; genuine failures surface as a 503 via `AiServiceException`.

## Frontend Architecture

- **Design system** (`src/theme/`) — deep pine-green + warm amber palette (deliberately not the generic
  cream/terracotta or dark/neon AI-tool defaults), Fraunces for display headings, Inter for UI text, IBM
  Plex Mono for data/timestamps. Dark mode is built into `buildTheme(mode)`. The signature visual motif is
  a pulse/ECG line (`components/common/PulseLine.jsx`), reused as the logo mark and as section dividers.
- **Auth** (`src/context/AuthContext.jsx`, `src/services/authService.js`) — token pair stored in
  `localStorage`; `src/services/apiClient.js` is an Axios instance that attaches the access token to every
  request and transparently refreshes + retries on a 401 (queueing concurrent requests during the refresh
  so a burst of calls doesn't trigger a burst of refreshes).
- **Routing** (`src/App.jsx`, `src/routes/`) — public routes (landing, login/register/forgot/reset/verify)
  are unguarded; `/admin/*`, `/doctor/*`, `/receptionist/*`, `/patient/*` sit behind `ProtectedRoute`
  (must be logged in) and `RoleRoute` (must have the matching role — a receptionist hitting `/admin/*` is
  redirected to their own dashboard, not shown a dead end). Every nav item in `routes/navConfig.js` maps to
  a real screen; the AI Assistant screens (Module 7) are the only ones still placeholders.
- **Layouts** — `PublicLayout` (marketing navbar + footer), `AuthLayout` (centered card for auth forms),
  `DashboardLayout` (role-aware collapsible sidebar + topbar with notifications and account menu).

## CRUD Screens (Module 6)

Every screen talks to the real Module 3 APIs through a matching `src/services/*.js` client (Axios,
one file per resource, mirroring the backend's REST routes 1:1).

- **Admin** — Doctors, Patients, Receptionists, Departments, Appointments, Medicines (+ inventory),
  Laboratories, Rooms, Billing, and a Reports screen with CSV export (`papaparse`). Dashboard shows live
  KPI cards and charts (`recharts`) sourced from `GET /dashboard/admin`.
- **Doctor** — Today's patients, appointment list, prescriptions (create/view with medicine line items),
  lab report requests and results, profile. Dashboard sourced from `GET /dashboard/doctor/{id}`.
- **Receptionist** — Register patient, book/manage appointments, a live check-in queue (advances patients
  through PENDING → CONFIRMED → IN_PROGRESS), billing (shared `BillingBoard` component also used by Admin),
  and room allocation (admit/discharge — receptionist can allocate/release beds but not create/delete rooms,
  matching the backend's `@PreAuthorize` rules exactly).
- **Patient** — Self-service booking with department → doctor → date/time selection, prescriptions and lab
  reports (read-only, with the `aiSummary` field already rendered wherever the backend provides one), bills
  with a pay dialog enforcing the balance-due limit client-side (and server-side), and profile/medical
  details. Dashboard aggregates upcoming appointments, prescription count, pending lab reports, and
  outstanding balance client-side since there's no dedicated patient-dashboard endpoint.
- **Shared components** — `PageHeader`, `ConfirmDialog`, `EmptyState`, `StatCard`, `AppointmentStatusChip`,
  `ChangePasswordCard`, loading skeletons, and a reusable `BillingBoard` (Admin + Receptionist billing are
  the same component with a different subtitle, since the underlying workflow — create bill, add line
  items, record payment — is identical for both roles).

## Testing (Module 8)

```bash
cd backend
mvn test
```

Tests run against H2 in-memory (MySQL compatibility mode) via `src/test/resources/application.yml` —
no real MySQL instance needed. Three layers are covered:

- **Service unit tests** (Mockito, `service/impl/*Test.java`) — `DepartmentServiceImpl`,
  `AppointmentServiceImpl` (conflict detection, queue numbering, status transitions),
  `BillServiceImpl` (total/tax/discount math, payment-balance enforcement, overpayment rejection),
  `AuthServiceImpl` (registration, login gating on email verification/active status, refresh-token
  rotation and revocation, password reset), `AiServiceImpl` (JSON response parsing including
  markdown-fence stripping, and prescription-explanation ownership checks) — every repository is
  mocked so these run in milliseconds and pin down business logic in isolation.
- **Repository test** (`@DataJpaTest`, `repository/AppointmentRepositoryTest.java`) — runs the
  custom `@Query` methods (conflict detection, active-appointment counts) against a real H2 database,
  since a typo in JPQL is exactly the kind of bug mocking can't catch.
- **Full-stack integration test** (`@SpringBootTest` + `MockMvc`, `integration/AuthFlowIntegrationTest.java`)
  — exercises the real `SecurityConfig`, JWT filter, and `GlobalExceptionHandler` together: register →
  blocked login before verification → verify → login → access a protected endpoint → get rejected from
  an admin-only endpoint as a patient → refresh (and confirm the old refresh token is revoked) → logout.
  This is the one test that would catch a broken wire between the filter chain and a controller that
  unit tests, mocking the security layer away, never would.

## Default Seed Login (Admin)

| Field | Value |
|---|---|
| Email | `admin@hms.local` |
| Password | `Admin@123` |

**Change this password immediately in any real deployment.**

## Documentation

| Doc | Covers |
|---|---|
| `README.md` (this file) | Overview, tech stack, folder structure, quick start, auth flow, AI integration, frontend architecture, CRUD screens, testing |
| `docs/INSTALLATION.md` | Detailed local setup (Docker and manual), troubleshooting |
| `docs/DEPLOYMENT.md` | VPS/cloud deployment, TLS, CI/CD, backups, monitoring, scaling |
| `docs/ARCHITECTURE.md` | System diagram, backend layering, request lifecycle, frontend state architecture |
| `docs/API.md` | Endpoint reference by resource (Swagger UI is the live source of truth) |
| `database/ER_DIAGRAM.md` | Entity-relationship diagram and schema design notes |
| `docker/README.md` | Docker Compose architecture and day-to-day operations |
| Swagger UI (`/api/swagger-ui.html`) | Live, always-accurate API reference — try requests directly |

## License

Proprietary — generated project skeleton for demonstration purposes.
