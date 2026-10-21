# =========================================================================
# LangCraft Production Multi-Stage Dockerfile
# Native Linux HarfBuzz, Pango, Google Noto Indic Fonts + Playwright Chromium
# =========================================================================

FROM node:20-bookworm-slim AS base
WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NEXT_TELEMETRY_DISABLED=1

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

# Install Playwright Chromium OS dependencies
RUN npx --yes playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/*

# Copy custom font substitution matrix
COPY fonts.conf /etc/fonts/local.conf
RUN fc-cache -f -v

# -------------------------------------------------------------------------
# Builder Stage
# -------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Download Chromium browser into /ms-playwright
RUN npx playwright install chromium

COPY . .
ENV NODE_ENV=production
RUN npm run build

# -------------------------------------------------------------------------
# Runner Stage
# -------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Non-root user for enterprise security
RUN groupadd -g 1001 nodejs && \
    useradd -s /bin/bash -u 1001 -g nodejs nextjs

# Copy Playwright Chromium browser binary
COPY --from=builder --chown=nextjs:nodejs /ms-playwright /ms-playwright

# Copy Next.js standalone build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
