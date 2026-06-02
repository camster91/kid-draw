# Multi-stage build: Vite → nginx
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund 2>&1 | tail -1
COPY . .
RUN npm run build

# Serve with nginx (unprivileged variant)
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Quoted heredoc so $uri stays literal in the nginx config (otherwise the shell
# would expand it to empty and nginx would 301 to /index.html, which then
# 301's back to /index.html — classic SPA redirect loop).
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets aggressively (Vite hashes filenames)
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Don't cache index.html
  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
}
EOF
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/ > /dev/null || exit 1
