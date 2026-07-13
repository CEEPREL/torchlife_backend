set -e

if [ "${SKIP_MIGRATIONS}" != "true" ]; then
  for i in $(seq 1 30); do
    if ./node_modules/.bin/prisma migrate deploy; then
      break
    fi
    if [ "$i" -eq 30 ]; then
      exit 1
    fi
    sleep 2
  done
fi

node dist/apps/client/main &
node dist/apps/admin/main &
wait
