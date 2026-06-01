# ─── Stage 1: Install ALL Dependencies ────────────────────────────────────────
# pnpm 10+ requires Node.js v22.13 or higher
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package management files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile; \
    if [ ! -f pnpm-lock.yaml ]; then \
    pnpm install; \
    fi

# ─── Stage 2: Build the Next.js App ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm in builder stage too
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ─── Stage 3: Production Runner ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ── Next.js Standalone Output ──────────────────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Direct execution without entrypoint
CMD ["node", "server.js"]
