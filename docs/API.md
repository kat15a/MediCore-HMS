# API Documentation

The authoritative, always-up-to-date API reference is **Swagger UI**, generated live from the code:

- Local: http://localhost:8080/api/swagger-ui.html
- Raw OpenAPI JSON: http://localhost:8080/api/v3/api-docs

Use the "Authorize" button with a JWT from `POST /auth/login` to try any protected endpoint directly
in the browser. This document is a quick-reference map of what exists; treat Swagger as the source
of truth for exact request/response shapes.

All routes below are relative to the API base path `/api` (e.g. `/auth/login` is really
`POST /api/auth/login`). Every response is wrapped in the standard envelope:

```json
{ "success": true, "message": "...", "data": { ... }, "timestamp": "..." }
```

Paginated list endpoints return `data` shaped as `{ content, pageNumber, pageSize, totalElements, totalPages, last }`.

## Authentication — `/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | Public | Self-register as a patient |
| POST | `/login` | Public | Get an access + refresh token pair |
| POST | `/refresh` | Public | Exchange a refresh token for a new pair (rotates) |
| POST | `/logout` | Public | Revoke a refresh token |
| POST | `/verify-email` | Public | Activate an account via emailed token |
| POST | `/resend-verification` | Public | Resend the verification email |
| POST | `/forgot-password` | Public | Request a password reset email |
| POST | `/reset-password` | Public | Reset password via emailed token |
| POST | `/change-password` | Authenticated | Change your own password |
| GET | `/me` | Authenticated | Current user's profile summary |

## People — `/departments`, `/doctors`, `/patients`, `/receptionists`

Standard CRUD on each (`POST` create, `GET /{id}` and `GET` list, `PUT /{id}` update,
`DELETE /{id}` remove) plus:
- `GET /doctors/search?keyword=`, `GET /doctors/department/{id}`, `PATCH /doctors/{id}/availability`
- `GET /patients/search?keyword=`
- `GET /doctors/by-user/{userId}`, `GET /patients/by-user/{userId}` — resolve a profile from the
  logged-in user's id (used by the frontend right after login)

Creating a Doctor/Patient/Receptionist provisions the linked `User` account in the same call.

## Appointments — `/appointments`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Book an appointment (conflict-checked against the doctor's existing schedule) |
| PATCH | `/{id}/status` | Transition status (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `NO_SHOW`) |
| PATCH | `/{id}/cancel` | Cancel with a reason |
| GET | `/{id}` | Single appointment |
| GET | `/patient/{patientId}` | Paginated, for a patient |
| GET | `/doctor/{doctorId}` | Paginated, for a doctor |
| GET | `/doctor/{doctorId}/schedule?date=` | A doctor's schedule for one day |
| GET | `/today` | Today's appointments hospital-wide (front desk) |

## Clinical — `/prescriptions`, `/laboratories`, `/lab-reports`

- Prescriptions: `POST /` (with medicine line items), `GET /{id}`, `GET /appointment/{id}`,
  `GET /patient/{id}` (paginated), `GET /doctor/{id}` (paginated).
- Laboratories: standard CRUD on the lab test catalog.
- Lab reports: `POST /` (request a test), `PATCH /{id}` (update status/results),
  `GET /{id}`, `GET /patient/{id}`, `GET /doctor/{id}` (both paginated).

## Inventory & Facilities — `/medicines`, `/rooms`

- Medicines: standard CRUD + `GET /search?keyword=`, `GET /low-stock`, `PATCH /{id}/stock`
  (adjust inventory quantity).
- Rooms: standard CRUD + `GET /available`, `PATCH /{id}/allocate`, `PATCH /{id}/release`
  (admit/discharge a bed).

## Billing — `/bills`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create a bill with line items (auto-computes subtotal/tax/discount/total) |
| GET | `/{id}` | Single bill |
| GET | `/patient/{patientId}` | Paginated, for a patient |
| GET | `/` | Paginated, all bills (admin/receptionist) |
| POST | `/payments` | Record a payment (enforces it can't exceed the balance due) |
| PATCH | `/{id}/cancel` | Cancel an unpaid bill |

## Notifications — `/notifications`

`GET /`, `GET /unread-count`, `PATCH /{id}/read`, `PATCH /read-all` — always scoped to the
current authenticated user.

## Dashboards — `/dashboard`

`GET /admin` (KPIs: patients, doctors, today's appointments, revenue, bed availability, low stock,
recent activity) and `GET /doctor/{doctorId}` (today's schedule + counts).

## AI Tools — `/ai`

| Method | Path | Purpose |
|---|---|---|
| POST | `/symptom-check` | Possible conditions, department, urgency, red flags |
| POST | `/reports/summarize-text` | Plain-language summary of pasted report text |
| POST | `/reports/summarize-pdf` | Same, from an uploaded PDF (multipart) |
| GET | `/prescriptions/{id}/explain` | Per-medicine explanation, saved onto the prescription |
| POST | `/chat` | Hospital FAQ chatbot, grounded with live department/doctor data |

See `README.md`'s "AI Integration" section for how the provider (Gemini/OpenAI) is selected and how
each feature is prompted.

## Error Shape

Every error (validation, not-found, auth, AI-service-unavailable, unexpected) returns the same
`ErrorResponse` shape directly (not wrapped in the `data` envelope above):

```json
{
  "timestamp": "2026-08-14T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "...",
  "path": "/api/...",
  "validationErrors": [{ "field": "email", "message": "must be a well-formed email address" }]
}
```

`validationErrors` is only present on `400`s from `@Valid` request-body validation failures.
