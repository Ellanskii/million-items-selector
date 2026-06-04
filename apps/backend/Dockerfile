FROM node:22-alpine AS base
RUN corepack enable

# Install all workspace deps
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/contracts/package.json packages/contracts/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile

# Build TypeScript + create isolated prod deploy
FROM deps AS build
COPY apps/backend apps/backend
RUN pnpm --filter @million-items-selector/backend build
RUN pnpm --filter @million-items-selector/backend deploy --prod /deploy

# Minimal runner: deploy output + compiled dist
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=build /deploy .
COPY --from=build /app/apps/backend/dist dist

ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "dist/index.js"]
