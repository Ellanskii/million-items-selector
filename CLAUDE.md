# CLAUDE.md

This repository is a fullstack monorepo:
- frontend: Nuxt 4 (Vue 3 + TypeScript)
- backend: Express.js (TypeScript)
- contracts: OpenAPI schema (source of truth)
- api-client: generated TypeScript SDK from OpenAPI

---

## Architecture

Monorepo structure:

apps/
  frontend/        # Nuxt app
  backend/         # Express API

packages/
  contracts/       # OpenAPI spec (YAML/JSON)
  api-client/      # generated TS client (DO NOT edit manually)

---

## Core principles

- OpenAPI is the single source of truth for API contracts
- Frontend MUST NOT call fetch/axios directly for backend routes
- All API calls go through generated client (packages/api-client)
- Backend MUST implement contracts exactly as defined in OpenAPI
- No business logic duplication between frontend and backend
- In-memory state only on backend (no DB)
- No user accounts — state is shared across all visitors

---

## Backend rules (Express)

- TypeScript required
- No ORM
- State stored in memory only
- Must implement:
  - pagination (limit=20 default)
  - filtering by id
  - selection state
  - reorder state

### Performance constraints

- All list endpoints MUST be paginated (max 20 items per request)
- Avoid full dataset transfers
- Filtering is server-side

---

## Frontend rules (Nuxt)

- TypeScript required
- Must use:
  - virtualized lists (no full DOM rendering of large lists)
  - composables for API access
  - Pinia for global state
- No direct API calls (use api-client only)

---

## API rules

- All endpoints defined in `packages/contracts/openapi.yaml`
- Client generated via:
  pnpm generate:api

- API must support:
  - GET /items
  - GET /selected
  - POST /select
  - POST /unselect
  - POST /reorder
  - POST /items (custom item creation)

---

## Queue & batching

Frontend implements the request queue (in `app/stores/items.ts`):

- deduplication: pending `select(id)` cancels pending `unselect(id)` and vice versa
- batching:
  - mutations (select/unselect/reorder) flushed every 1s
  - item creation flushed every 10s
- polling: GET /items + GET /selected executed every 1s after each mutation flush

Queue rules:
- identical operations within batch window are collapsed (Set-based dedup)
- no duplicate selects/unselects
- concurrent flushes are prevented via `flushing` guard

Backend applies all operations immediately and synchronously. Idempotency is
enforced in state functions (`selected.has(id)` before select, etc.).

---

## State model (backend)

In-memory only:

- items: number[]
- selected: number[]
- order: number[] (selected order)

State must survive page reload (process lifetime only)

---

## Frontend behavior

- left panel:
  - all items except selected
  - infinite scroll (page size = 20)
  - filter by id
  - add custom item

- right panel:
  - selected items
  - infinite scroll (page size = 20)
  - filter by id
  - drag & drop reorder (must work on filtered list too)
  - persisted order

---

## Generated API client

Location:
packages/api-client

Rules:
- NEVER edit manually
- regenerate after contract changes
- always import from:

  import { api } from '@million-items-selector/api-client'

---

## Quality constraints

- no unbounded arrays rendered
- no client-side full dataset storage
- no direct DOM manipulation for drag logic
- all mutations must be reflected in server state

---

## Dev commands

pnpm dev          # run all apps
pnpm dev:frontend
pnpm dev:backend
pnpm generate:api # regenerate OpenAPI client
pnpm lint
pnpm build

---

## Deployment

- Personal VDS with Coolify
- API must be reachable from frontend via env NUXT_API_BASE_URL

---

## Notes

This project is intentionally over-engineered to demonstrate:
- large dataset handling
- contract-first API design
- queue-based frontend processing
- deterministic state synchronization
- scalable frontend rendering