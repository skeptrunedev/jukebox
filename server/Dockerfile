# Use official Node.js LTS image as the base image
FROM node:lts-slim

# Install build dependencies for sqlite3
RUN apt-get update && apt-get install -y python3 python3-pip make g++ libsqlite3-dev && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code and build
COPY . .
RUN yarn build

# Expose API port
EXPOSE 3001

# Run database migrations and start the server
CMD ["sh", "-c", "yarn migrate && yarn start"]