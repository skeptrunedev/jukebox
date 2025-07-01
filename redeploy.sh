#!/usr/bin/env bash
set -euo pipefail

BUILD_LOCAL=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --build-local)
      BUILD_LOCAL=true
      shift
      ;;
    *)
      ;;
  esac
done

if [ "$BUILD_LOCAL" = true ]; then
  echo "Building images locally for all services..."
  docker compose build
else
  echo "Pulling latest images for all services..."
  docker compose pull
fi

services=$(docker compose config --services | grep -vi "minio")

for service in $services; do
  echo "Updating service: $service"
  docker compose up -d --no-deps "$service"
done

echo "Redeploy completed successfully."