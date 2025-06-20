FROM node:22 AS build

WORKDIR /app

# Install dependencies and build the app
COPY package.json yarn.lock tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

RUN yarn install --frozen-lockfile
RUN yarn run build

FROM nginx:1.25.4-alpine-slim

WORKDIR /usr/share/nginx/html

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx configuration to serve index.html for client-side routing
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Entrypoint script to inject runtime environment variables into index.html
COPY <<'EOF' /docker-entrypoint.d/01-insert-window-variable.sh
#!/bin/sh

set -eu

cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.template
envsubst < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html 
rm /usr/share/nginx/html/index.html.template

EOF

RUN chmod +x /docker-entrypoint.d/01-insert-window-variable.sh

EXPOSE 80