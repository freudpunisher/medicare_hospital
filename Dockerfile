# ─── Stage: Production Runner ──────────────────────────────────────────────
# Since local pnpm build was successful, we can skip the build stage inside Docker
# and copy the standalone output directly. This avoids network timeouts.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ── Next.js Standalone Output (Copied from local build) ────────────────────
# This requires running 'pnpm run build' locally on your machine first.
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Direct execution of the standalone server
CMD ["node", "server.js"]
