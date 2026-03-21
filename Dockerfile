# ──────────────────────────────────────────────
# DebateForge — Multi-stage Docker build
# ──────────────────────────────────────────────
# Note: Electron apps don't run in Docker containers directly,
# but this is useful for CI/CD build environments

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --production=false

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS production
RUN npm ci --production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

CMD ["node", "dist/main/main.js"]
