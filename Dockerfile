# OfferLens — Dockerfile
FROM denoland/deno:alpine-2.2.0

WORKDIR /app

# Copy config first for dependency caching
COPY deno.jsonc ./
COPY main.ts ./

# Copy source
COPY libs/ ./libs/
COPY apps/api/ ./apps/api/
COPY apps/web/static/ ./apps/web/static/

# Pre-cache dependencies (tolerate failure)
RUN deno cache main.ts 2>/dev/null || true

EXPOSE 8000

# Env vars set via Docker environment, NOT hardcoded
CMD ["run", "-A", "main.ts"]
