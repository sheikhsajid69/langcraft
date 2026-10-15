# =========================================================================
# LangCraft Production Multi-Stage Dockerfile
# With Native Linux HarfBuzz, Pango, and Google Noto Indic Font Stack
# =========================================================================

FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install system dependencies: HarfBuzz, Pango, Fontconfig, and Google Noto Fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    libharfbuzz0b \
    libharfbuzz-icu0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libicu72 \
    fonts-noto-core \
    fonts-noto-extra \
    fonts-noto-ui-core \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy custom font substitution matrix to fontconfig directory
COPY fonts.conf /etc/fonts/local.conf

# Rebuild font cache so HarfBuzz discovers all Noto Indic substitutions immediately
RUN fc-cache -f -v

# -------------------------------------------------------------------------
# Builder Stage
# -------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# -------------------------------------------------------------------------
# Production Runner Stage
# -------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for enterprise security
RUN groupadd -g 1001 nodejs && \
    useradd -s /bin/bash -u 1001 -g nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
