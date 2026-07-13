#!/bin/sh
set -eu

if node -e "const pkg=require('./package.json'); process.exit(pkg?.prisma?.seed ? 0 : 1)"; then
  echo "Running Prisma seed..."
  npx prisma db seed
  exit 0
fi

if node -e "const pkg=require('./package.json'); process.exit(pkg?.scripts?.['db:seed'] ? 0 : 1)"; then
  echo "Running db:seed script..."
  yarn db:seed
  exit 0
fi

if node -e "const pkg=require('./package.json'); process.exit(pkg?.scripts?.seed ? 0 : 1)"; then
  echo "Running seed script..."
  yarn seed
  exit 0
fi

echo "No database seed script configured. Skipping seed step."
