#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BACKUP_DIR=${BACKUP_DIR:-"${ROOT_DIR}/backups"}
COMPOSE_FILE=${1:-docker-compose.production.yml}
POSTGRES_SERVICE=${POSTGRES_SERVICE:-postgres}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-torchlife}

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/torchlife_$(date '+%Y_%m_%d').sql"

echo "Creating PostgreSQL backup at ${BACKUP_FILE}..."
docker compose -f "${ROOT_DIR}/${COMPOSE_FILE}" exec -T "$POSTGRES_SERVICE" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}"
