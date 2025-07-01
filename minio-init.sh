#!/bin/sh

# Wait for MinIO to be ready
until mc alias set minio http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; do
  echo "Waiting for MinIO to be available..."
  sleep 2
done

# Create the bucket if it doesn't exist
mc mb --ignore-existing minio/$S3_BUCKET_NAME
