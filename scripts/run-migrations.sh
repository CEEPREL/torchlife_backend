#!/bin/sh
set -eu

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Validating Prisma migration state..."
npx prisma migrate status
