FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# VITE_* variables are injected by Railway at build time — Vite bakes them
# into the static bundle, so they must be available when vite build runs.
RUN npm run build

# ── Production image ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# vite preview needs the config, built dist/, and its own node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/vite.config.js ./
COPY --from=builder /app/dist ./dist

RUN npm install

EXPOSE 8080

CMD ["npm", "run", "preview"]
