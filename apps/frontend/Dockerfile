FROM node:22-alpine AS base
RUN corepack enable

# Install all workspace deps
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
COPY packages/contracts/package.json packages/contracts/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile

# Generate API client from OpenAPI spec
FROM deps AS api-gen
COPY packages/contracts packages/contracts
COPY packages/api-client packages/api-client
RUN pnpm --filter @million-items-selector/api-client generate

# Build Nuxt — NUXT_PUBLIC_API_BASE is a runtime config, no build-time baking needed
FROM api-gen AS build
COPY apps/frontend apps/frontend
RUN pnpm --filter @million-items-selector/frontend build

# Minimal runner: Nuxt .output is fully self-contained
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/frontend/.output .output

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
