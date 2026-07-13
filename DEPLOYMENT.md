# TorchLife Docker Deployment

## Overview

TorchLife runs as three Docker Compose services:

- `app`: NestJS backend
- `postgres`: PostgreSQL with persistent volume storage
- `redis`: Redis with persistent volume storage

This setup is designed so local and production-like environments use the same containerized infrastructure without requiring an external PostgreSQL provider.

## Files

- `docker-compose.local.yml`: local development stack with live source mounting
- `docker-compose.production.yml`: production-oriented stack
- `docker-compose.yml`: default production-style compose entrypoint
- `scripts/start.sh`: startup orchestration
- `scripts/run-migrations.sh`: migration execution
- `scripts/run-seed.sh`: optional seed execution
- `scripts/backup-postgres.sh`: backup creation
- `scripts/restore-postgres.sh`: backup restore
- `scripts/validate-stack.sh`: stack validation

## Local Development

1. Copy `env.example` to `.env`.
2. Confirm backend app uses:
   - `DATABASE_URL`
3. Confirm local Postgres container values for:
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `REDIS_URL`
4. Start the full local stack:

```bash
docker compose -f docker-compose.local.yml up --build
```

The local startup flow performs these steps automatically:

1. Builds the application image
2. Starts PostgreSQL
3. Starts Redis
4. Waits for PostgreSQL health
5. Waits for Redis health
6. Runs Prisma migrations
7. Runs seeders if configured
8. Verifies database connectivity and migration state
9. Verifies Redis connectivity and read/write behavior
10. Starts the NestJS server
11. Verifies `http://127.0.0.1:3000/api/health` inside the container
12. Streams logs in the terminal

The API is exposed locally at:

```text
http://127.0.0.1:1011
```

Health endpoint:

```text
http://127.0.0.1:1011/api/health
```

## Production-Like Docker Deployment

Start the production-oriented stack with:

```bash
docker compose -f docker-compose.production.yml up --build -d
```

Follow logs with:

```bash
docker compose -f docker-compose.production.yml logs -f app
```

Stop the stack with:

```bash
docker compose -f docker-compose.production.yml down
```

Persistent data remains in the named volumes:

- `postgres_data`
- `redis_data`

These volumes preserve data across:

- container restarts
- app redeployments
- Docker daemon restarts
- host server reboots

## Backup

Create a PostgreSQL backup with:

```bash
./scripts/backup-postgres.sh docker-compose.production.yml
```

For local development:

```bash
./scripts/backup-postgres.sh docker-compose.local.yml
```

Backups are written to:

```text
./backups/torchlife_YYYY_MM_DD.sql
```

## Restore

Restore a backup with:

```bash
./scripts/restore-postgres.sh ./backups/torchlife_YYYY_MM_DD.sql docker-compose.production.yml
```

For local development:

```bash
./scripts/restore-postgres.sh ./backups/torchlife_YYYY_MM_DD.sql docker-compose.local.yml
```

The restore script:

1. terminates active connections
2. drops the target database
3. recreates the database
4. restores the SQL dump

## Validation

Run validation from inside the running `app` container:

```bash
docker compose -f docker-compose.local.yml exec app ./scripts/validate-stack.sh
```

This validates:

- PostgreSQL connection
- expected database selection
- Prisma migration table presence
- public tables existence
- Redis ping
- Redis set/get/delete behavior
- application health endpoint

## Notes On Render

The repository previously contained a Render blueprint that provisioned managed PostgreSQL and Redis. That architecture does not match this Docker Compose based, self-hosted database strategy.

This implementation is production-ready for Docker hosts that support Docker Compose and persistent storage. Render does not natively run multi-service Docker Compose stacks with local sidecar volumes the same way a VPS or dedicated Docker host does.

If Render remains a hard deployment requirement, the platform constraints need to be revisited before promising a no-external-database Compose deployment there.
