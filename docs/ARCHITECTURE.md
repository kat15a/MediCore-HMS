# Project Architecture

## System Overview

```mermaid
graph TB
    subgraph Client
        Browser["Browser<br/>React 19 + Vite SPA"]
    end

    subgraph "Frontend Container (nginx)"
        Static["Static build<br/>(index.html, JS, CSS)"]
        Proxy["/api/* and /uploads/*<br/>reverse-proxied"]
    end

    subgraph "Backend Container (Spring Boot)"
        Controller["Controllers<br/>REST + validation"]
        Service["Services<br/>business logic"]
        Security["Spring Security<br/>JWT filter chain"]
        AI["AI package<br/>AiProvider abstraction"]
        Repo["Spring Data JPA<br/>repositories"]
    end

    subgraph External
        MySQL[("MySQL 8<br/>Flyway-migrated schema")]
        Gemini["Gemini API"]
        OpenAI["OpenAI API"]
        SMTP["SMTP server<br/>(email)"]
    end

    Browser -->|HTTPS| Static
    Browser -->|HTTPS /api/*| Proxy
    Proxy --> Controller
    Controller --> Security
    Security --> Service
    Service --> Repo
    Service --> AI
    Repo --> MySQL
    AI -->|"AI_PROVIDER=gemini"| Gemini
    AI -->|"AI_PROVIDER=openai"| OpenAI
    Service -->|async| SMTP
```

## Backend: Clean-Architecture Layering

```mermaid
graph LR
    A[controller] --> B[service interfaces]
    B --> C[service.impl]
    C --> D[repository]
    D --> E[entity]
    C --> F[dto.request/response]
    C --> G[mapper]
    C --> H[ai]
    C --> I[email]
    A --> J[security]
    A --> K[exception]
    L[scheduler] -.->|cron| C
```

Each package has exactly one job:

| Package | Responsibility |
|---|---|
| `controller` | HTTP boundary — request mapping, `@PreAuthorize` role checks, delegates to services |
| `service` / `service.impl` | Business logic, transactions (`@Transactional`), the only layer allowed to orchestrate multiple repositories |
| `repository` | Spring Data JPA interfaces — no business logic, just queries |
| `entity` | JPA-mapped domain objects, 1:1 with the database schema |
| `dto.request` / `dto.response` | The API's actual contract — entities never leave the service layer directly |
| `security` | JWT issuance/validation, `UserDetailsService`, filter chain |
| `ai` | The `AiProvider` abstraction — `GeminiAiProvider` / `OpenAiAiProvider`, swappable via config |
| `email` | Async transactional email (verification, reset, appointment notifications) |
| `exception` | Custom exceptions + `GlobalExceptionHandler` — every error becomes a consistent JSON shape |
| `config` | `SecurityConfig`, `OpenApiConfig`, `AiConfig`, `WebMvcConfig` — framework wiring, no business logic |

## Request Lifecycle (authenticated write, e.g. booking an appointment)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant JWT as JwtAuthenticationFilter
    participant C as AppointmentController
    participant S as AppointmentServiceImpl
    participant R as AppointmentRepository
    participant DB as MySQL

    FE->>JWT: POST /api/appointments (Bearer token)
    JWT->>JWT: validate token, load UserPrincipal
    JWT->>C: forward with SecurityContext populated
    C->>C: @PreAuthorize role check
    C->>S: book(request, bookedByUserId)
    S->>R: findConflicting(doctorId, date, time)
    R->>DB: SELECT ... WHERE status NOT IN (CANCELLED, NO_SHOW)
    DB-->>R: []
    S->>R: save(appointment)
    R->>DB: INSERT
    S-->>C: AppointmentResponse
    C-->>FE: 200 { success, data }
```

## Frontend: Component & State Architecture

```mermaid
graph TB
    Main[main.jsx] --> Theme[ThemeProvider]
    Theme --> Snackbar[SnackbarProvider]
    Snackbar --> Router[BrowserRouter]
    Router --> AuthCtx[AuthProvider]
    AuthCtx --> App[App.jsx routes]

    App --> Public["Public routes<br/>Landing, Login, Register..."]
    App --> Protected["Protected routes<br/>ProtectedRoute → RoleRoute → DashboardLayout"]

    Protected --> Admin["/admin/* pages"]
    Protected --> Doctor["/doctor/* pages"]
    Protected --> Reception["/receptionist/* pages"]
    Protected --> Patient["/patient/* pages"]

    Admin --> Services[services/*.js Axios clients]
    Doctor --> Services
    Reception --> Services
    Patient --> Services
    Services --> ApiClient[apiClient.js<br/>token attach + refresh-on-401]
    ApiClient -.->|HTTP| Backend[(Backend API)]
```

`apiClient.js` is the single chokepoint every service file goes through — it attaches the access
token to every request and, on a 401, transparently refreshes and retries (queueing concurrent
requests during the refresh so a burst of calls doesn't trigger a burst of token refreshes). No page
component talks to Axios directly.

## Database Schema

See `database/ER_DIAGRAM.md` for the full entity-relationship diagram and design notes, and
`backend/src/main/resources/db/migration/V1__init_schema.sql` for the authoritative, executable schema.

## Folder Structure

See the root `README.md`'s Folder Structure section for the annotated directory tree.
