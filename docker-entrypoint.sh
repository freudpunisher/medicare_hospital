#!/bin/sh
set -e

echo "⏳ Running database migrations..."
npx drizzle-kit migrate

# Seed admin user only if SEED_ADMIN=true
if [ "$SEED_ADMIN" = "true" ]; then
  echo "🌱 Seeding admin user..."
  npx tsx db/seed.admin.ts
else
  echo "ℹ️  SEED_ADMIN is not 'true', skipping admin seed."
fi

echo "🚀 Starting application..."
exec "$@"
