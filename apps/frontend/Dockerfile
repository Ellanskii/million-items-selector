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

# Generate static SPA — index.html + assets land in .output/public/
FROM api-gen AS build
ARG API_BASE_URL=http://localhost:3001
ENV NUXT_PUBLIC_API_BASE=$API_BASE_URL
COPY apps/frontend apps/frontend
RUN pnpm --filter @million-items-selector/frontend generate

# Serve static files with nginx
FROM nginx:alpine AS runner
COPY --from=build /app/apps/frontend/.output/public /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
