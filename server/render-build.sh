#!/bin/bash

# Render build script for automatic Prisma migrations
# This script runs during deployment on Render (free tier doesn't have shell access)

set -euo pipefail  # Exit on error, treat unset variables as error, catch failures in pipes

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Build complete!"
