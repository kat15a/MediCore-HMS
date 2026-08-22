# Deployment Guide

This guide covers taking MediCore from `docker compose up` on a laptop to a real, internet-facing
deployment. For local development and the Docker architecture itself, see the root `README.md` and
`docker/README.md` first — this document picks up from there.

## 1. Choosing a Deployment Target

| Option | Good for | Notes |
|---|---|---|
| Single VPS (DigitalOcean, Hetzner, Linode, AWS Lightsail) + Docker Compose | Small-to-mid hospitals, fastest path to production | This guide's primary walkthrough |
| Managed container platform (Render, Railway, Fly.io) | Teams that don't want to manage servers | Deploy `backend` and `frontend` as two services; use their managed MySQL/Postgres add-on |
| Kubernetes (EKS/GKE/AKS) | Multi-hospital / high-scale deployments | Out of scope here, but the same Docker images (`backend/Dockerfile`, `frontend/Dockerfile`) work unchanged as pod images |

Whichever you choose, the same three building blocks apply: a MySQL instance, the backend container,
and the frontend container (or the frontend's static build served from a CDN, if you split them).

## 2. Single VPS with Docker Compose (recommended starting point)

### 2.1 Provision the server

- Ubuntu 22.04 LTS, minimum 2 vCPU / 4GB RAM (MySQL + JVM both want headroom).
- Install Docker Engine + the Compose plugin: https://docs.docker.com/engine/install/ubuntu/
- Open ports 80 and 443 in your cloud provider's firewall (and 22 for SSH — nothing else needs to
  be public; MySQL's 3306 should **not** be exposed to the internet in production).

### 2.2 Get the code onto the server

```bash
git clone <your-repo-url> hms
cd hms
cp .env.example .env
```

Edit `.env`:
- `JWT_SECRET` — generate with `openssl rand -base64 48`. Never reuse the dev default.
- `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` — strong, unique passwords.
- `MAIL_USERNAME` / `MAIL_PASSWORD` — real SMTP credentials (an app password if using Gmail), or
  email verification and password-reset links won't send.
- `AI_PROVIDER` + the matching API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`).
- `CORS_ALLOWED_ORIGINS` / `FRONTEND_BASE_URL` — set these to your real domain
  (`https://medicore.yourhospital.com`), not `localhost`.

### 2.3 Put TLS in front of it

`docker-compose.yml` as shipped exposes plain HTTP on the ports you choose. For a real deployment,
put a TLS-terminating reverse proxy in front of the `frontend` container. The simplest option is
[Caddy](https://caddyserver.com/), which gets you free auto-renewing Let's Encrypt certificates with
a three-line config:

```caddyfile
# /etc/caddy/Caddyfile
medicore.yourhospital.com {
    reverse_proxy localhost:8081
}
```

```bash
sudo apt install -y caddy
sudo systemctl restart caddy
```

(Nginx + certbot, or your cloud provider's managed load balancer with an ACM/Let's Encrypt
certificate, work equally well — Caddy is just the least config.)

### 2.4 Start it

```bash
docker compose up -d --build
docker compose logs -f backend   # watch Flyway migrate + seed on first boot
```

Visit `https://medicore.yourhospital.com`, log in with the seeded admin
(`admin@hms.local` / `Admin@123`), and **change that password immediately**
(Profile → Change Password, or `POST /auth/change-password`).

## 3. CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`/`develop`:

1. **Backend job** — `mvn clean verify` (runs the full Module 8 test suite against H2), then
   `mvn package` to confirm the jar actually builds.
2. **Frontend job** — `npm install && npm run build`, confirming the Vite build succeeds.
3. **Docker build job** — builds both `Dockerfile`s (no push) as a final sanity check that the
   images that would ship actually build cleanly.

To turn this into continuous *deployment*, extend the workflow with a step that builds and pushes
images to a registry (GitHub Container Registry, Docker Hub, ECR) tagged with the commit SHA, then
SSHes into the VPS (or calls your platform's deploy API) to pull and restart:

```yaml
  deploy:
    needs: [backend, frontend, docker-build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd hms && git pull && docker compose up -d --build
```

Store `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, and any secret env values as GitHub Actions
repository secrets — never commit them.

## 4. Database Migrations in Production

Flyway runs automatically on backend startup (`spring.flyway.enabled: true`,
`baseline-on-migrate: true`) — every `docker compose up -d --build` (or CD deploy) applies any new
`V*__*.sql` files under `backend/src/main/resources/db/migration/` before the app accepts traffic.
Add new migrations as new `V3__description.sql`, `V4__...` files — never edit an already-applied
migration file, since Flyway checksums them.

## 5. Backups

The only state that matters is the `hms-mysql-data` volume (the database) and `hms-backend-uploads`
(profile photos, lab report files, prescription PDFs). At minimum:

```bash
# Database dump
docker compose exec mysql sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" hms_db' > backup-$(date +%F).sql

# Uploads
docker run --rm -v hms_hms-backend-uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Automate both as a nightly cron job and ship the results off-server (S3, Backblaze B2, etc.) — a
backup that only lives on the same disk as the database isn't a backup.

## 6. Monitoring

- The backend exposes `GET /api/actuator/health` (already used by the Docker healthcheck) — point
  an uptime monitor (UptimeRobot, Better Stack, your cloud provider's health checks) at it.
- Application logs go to stdout in both containers — `docker compose logs -f` locally, or ship them
  to a log aggregator (Loki, CloudWatch Logs, Datadog) for anything beyond a single-server setup.
- Watch disk usage on the MySQL volume and the uploads volume — neither has automatic pruning.

## 7. Scaling Notes

- The backend is stateless (JWTs + a DB-backed refresh-token table, no server-side sessions), so it
  horizontally scales by simply running more `backend` replicas behind a load balancer — no sticky
  sessions needed.
- MySQL is the one stateful piece; for real scale, move to a managed MySQL (RDS, Cloud SQL,
  PlanetScale) rather than the `mysql` container, and point `DB_HOST` at it.
- Uploaded files (`FILE_STORAGE_DIR`) are local-disk in this setup — for multi-replica backend
  deployments, switch to a shared object store (S3-compatible) so every replica sees the same files.
  That's a small change scoped to `email`/file-upload controllers, not a schema change.
