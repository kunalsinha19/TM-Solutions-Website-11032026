FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source after dependencies so the layer is cached
COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
