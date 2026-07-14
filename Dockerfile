FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Dependency layer (cached unless manifests change) ──────────────────────────
# Copy only the manifests needed to resolve the workspace graph.
# admin/ and frontend/ are workspaces declared in the root package.json but
# are NOT imported by apps/web. Instead of COPY-ing their package.json files
# (which can go missing from the Docker build context due to Railway's layer
# cache snapshot behaviour), we stub them with a RUN command so npm install
# can resolve the workspace graph without needing the actual source.
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/

RUN mkdir -p admin frontend && \
    echo '{"name":"tara-maa-admin","version":"1.0.0","private":true}' > admin/package.json && \
    echo '{"name":"tara-maa-frontend","version":"1.0.0","private":true}' > frontend/package.json

RUN npm install --legacy-peer-deps

# ── Source layer (invalidated on any source change) ────────────────────────────
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=@tara-maa/web

# ── Production image ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# next.config output:"standalone" produces a self-contained bundle
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static assets (standalone does not include these automatically)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Public folder (images, favicon, robots.txt, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node apps/web/server.js"]
