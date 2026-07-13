#!/bin/sh
set -eu

if [ "${1:-}" = "" ]; then
  echo "Usage: ./scripts/restore-postgres.sh <backup-file> [compose-file]" >&2
  exit 1
fi

BACKUP_FILE=$1
COMPOSE_FILE=${2:-docker-compose.production.yml}
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
POSTGRES_SERVICE=${POSTGRES_SERVICE:-postgres}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-torchlife}

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Restoring PostgreSQL database ${POSTGRES_DB} from ${BACKUP_FILE}..."

docker compose -f "${ROOT_DIR}/${COMPOSE_FILE}" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();"

docker compose -f "${ROOT_DIR}/${COMPOSE_FILE}" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"${POSTGRES_DB}\";"

docker compose -f "${ROOT_DIR}/${COMPOSE_FILE}" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"${POSTGRES_DB}\";"

cat "$BACKUP_FILE" | docker compose -f "${ROOT_DIR}/${COMPOSE_FILE}" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restore completed successfully."
