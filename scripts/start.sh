#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-torchlife}
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
PORT=${PORT:-3000}

DB_WAIT_RETRIES=${DB_WAIT_RETRIES:-30}
REDIS_WAIT_RETRIES=${REDIS_WAIT_RETRIES:-30}
APP_HEALTH_RETRIES=${APP_HEALTH_RETRIES:-30}
WAIT_SLEEP_SECONDS=${WAIT_SLEEP_SECONDS:-2}
APP_HEALTHCHECK_URL=${APP_HEALTHCHECK_URL:-http://127.0.0.1:${PORT}/api/health}

wait_for_postgres() {
  echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}..."
  node "$SCRIPT_DIR/wait-for-tcp.mjs" \
    "$POSTGRES_HOST" \
    "$POSTGRES_PORT" \
    "$DB_WAIT_RETRIES" \
    $((WAIT_SLEEP_SECONDS * 1000)) \
    PostgreSQL
}

wait_for_redis() {
  echo "Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT}..."
  node "$SCRIPT_DIR/wait-for-tcp.mjs" \
    "$REDIS_HOST" \
    "$REDIS_PORT" \
    "$REDIS_WAIT_RETRIES" \
    $((WAIT_SLEEP_SECONDS * 1000)) \
    Redis
}

wait_for_app_health() {
  echo "Waiting for application health endpoint at ${APP_HEALTHCHECK_URL}..."
  attempt=1
  while [ "$attempt" -le "$APP_HEALTH_RETRIES" ]; do
    if ! kill -0 "$APP_PID" 2>/dev/null; then
      echo "Application process exited before becoming healthy." >&2
      return 1
    fi

    if node "$SCRIPT_DIR/wait-for-http.mjs" "$APP_HEALTHCHECK_URL" 1 100 >/dev/null 2>&1; then
      echo "Application health endpoint is healthy."
      return 0
    fi

    echo "Application health endpoint not ready yet (${attempt}/${APP_HEALTH_RETRIES})."
    attempt=$((attempt + 1))
    sleep "$WAIT_SLEEP_SECONDS"
  done

  echo "Application health endpoint did not become ready in time." >&2
  return 1
}

shutdown() {
  if [ "${APP_PID:-}" != "" ] && kill -0 "$APP_PID" 2>/dev/null; then
    kill -TERM "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" || true
  fi
}

trap shutdown INT TERM

wait_for_postgres
wait_for_redis
"$SCRIPT_DIR/run-migrations.sh"
"$SCRIPT_DIR/run-seed.sh"
node "$SCRIPT_DIR/verify-db.mjs"
node "$SCRIPT_DIR/verify-redis.mjs"

echo "Starting application: $*"
"$@" &
APP_PID=$!

if ! wait_for_app_health; then
  shutdown
  exit 1
fi

echo "Startup validation complete."
wait "$APP_PID"
