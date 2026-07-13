# TorchLife Docker Validation

## Automated Startup Validation

The application container now validates its runtime dependencies before serving traffic.

`scripts/start.sh` enforces this startup order:

1. PostgreSQL starts
2. PostgreSQL passes readiness
3. Redis starts
4. Redis passes readiness
5. Prisma migrations execute
6. Seeders run if configured
7. Database validation passes
8. Redis validation passes
9. NestJS application starts
10. `/api/health` returns success

If any stage fails, the app container exits with a non-zero status and the deployment stops.

## Health Checks

### PostgreSQL

Docker health check:

```bash
pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Checks:

- PostgreSQL process is running
- target database accepts connections

### Redis

Docker health check:

```bash
redis-cli ping
```

Expected response:

```text
PONG
```

Checks:

- Redis server is reachable
- Redis responds to commands

### Application

Application health endpoint:

```text
/api/health
```

Checks:

- NestJS app process is running
- PostgreSQL query succeeds
- Redis ping succeeds

## Manual Validation Commands

Start local validation environment:

```bash
docker compose -f docker-compose.local.yml up --build
```

Check container health:

```bash
docker compose -f docker-compose.local.yml ps
```

Check health endpoint:

```bash
curl http://127.0.0.1:1011/api/health
```

Run full in-container validation:

```bash
docker compose -f docker-compose.local.yml exec app ./scripts/validate-stack.sh
```

## What The Validation Script Confirms

### PostgreSQL

- connection succeeds
- current database matches the expected database
- `_prisma_migrations` exists
- public tables exist

### Redis

- connection succeeds
- `PING` returns `PONG`
- set/get/delete cycle works

### Application

- `/api/health` returns HTTP `200`

## Persistence Testing

To verify persistence:

1. Start the stack
2. Create or update test data
3. Restart the stack:

```bash
docker compose -f docker-compose.local.yml down
docker compose -f docker-compose.local.yml up --build
```

4. Confirm the data still exists

To verify a destructive reset when needed:

```bash
docker compose -f docker-compose.local.yml down -v
```

That command removes:

- `postgres_data`
- `redis_data`

Use it only when you intentionally want a clean database and cache state.
