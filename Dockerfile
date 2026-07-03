# OfferLens — Dockerfile
# Stage 1: Build SPA
FROM denoland/deno:alpine-2.9.0 AS builder

WORKDIR /build

# Copy config for dependency caching
COPY deno.jsonc ./

# Copy SPA source
COPY apps/web/ ./apps/web/

# Pre-compile TailwindCSS v4 CSS
RUN deno run -A npm:@tailwindcss/cli@^4 -i apps/web/src/style.css -o apps/web/src/tailwind.css 2>/dev/null || true

# Pre-cache Vite deps (tolerate failure)
RUN deno cache npm:vite@^6 npm:@preact/preset-vite@^2 2>/dev/null || true

# Build SPA
RUN deno run -A npm:vite@^6 build apps/web

# Stage 2: Runtime
FROM denoland/deno:alpine-2.9.0

WORKDIR /app

# Copy config first
COPY deno.jsonc ./
COPY main.ts ./

# Copy source
COPY libs/ ./libs/
COPY apps/api/ ./apps/api/

# Copy built SPA from builder
COPY --from=builder /build/apps/web/dist ./apps/web/dist

# Pre-cache dependencies (tolerate failure)
RUN deno cache main.ts 2>/dev/null || true

EXPOSE 8000

# Env vars set via Docker environment, NOT hardcoded
# Run migration then start server
CMD deno run -A libs/db/migrate.ts && deno run -A main.ts
