# syntax=docker/dockerfile:1
# ── build ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Vite bakes the API base URL at build time. Empty = same-origin: the nginx proxy below
# forwards /api, /ping and /health to the API service (no CORS needed). Override the build
# arg to point the SPA at an external API instead.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build

# ── runtime ────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
