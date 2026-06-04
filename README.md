[Русская версия](#русская-версия)

# Million Items Selector

A fullstack demo app: select and reorder items from a list of 1,000,000 using infinite scroll, drag & drop, and a client-side request queue.

**Live:** [million-items-selector.ellanski.dev](https://million-items-selector.ellanski.dev)

## Packages

| Package | Description | README |
|---|---|---|
| `apps/frontend` | Nuxt 4 SPA — virtual scroll, drag & drop, request queue | [→](apps/frontend/README.md) |
| `apps/backend` | Express.js API — in-memory state, pagination, reorder | [→](apps/backend/README.md) |
| `packages/contracts` | OpenAPI spec — single source of truth for the API | — |
| `packages/api-client` | Generated TypeScript SDK (openapi-fetch) — do not edit manually | — |

## Tech stack

**Frontend** — Nuxt 4 · Vue 3 · TypeScript · TanStack Query · TanStack Virtual · vue-draggable-plus · Pinia · Nuxt UI

**Backend** — Express.js · TypeScript · in-memory state (no DB)

**Contracts** — OpenAPI 3.1 · openapi-typescript

## Architecture highlights

- **Contract-first:** OpenAPI spec drives everything — backend routes implement it, frontend SDK is generated from it.
- **Client-side queue:** mutations (select, unselect, reorder) are batched every 1s; item creation every 10s. Deduplication via reactive Sets.
- **Optimistic UI:** selected items vanish from the left panel immediately; `hiddenFromLeft` clears only when the server confirms.
- **Bounded polling:** a separate `useQuery` polls only page 1 every 1s (constant 1 req/s) instead of re-fetching the whole accumulated scroll history.

## Dev

```sh
pnpm install
pnpm dev          # runs frontend (localhost:3000) and backend (localhost:3001)
pnpm generate:api # regenerate TypeScript client after contract changes
pnpm lint
pnpm build
```

## Deployment

Docker Compose on a VDS via Coolify. Set one env variable before deploying:

```
API_BASE_URL=https://api.your-domain.com
```

---

---

# Русская версия

# Million Items Selector

Fullstack-демо: выбор и сортировка элементов из списка в 1 000 000 позиций — с инфинити-скроллом, drag & drop и клиентской очередью запросов.

**Live:** [million-items-selector.ellanski.dev](https://million-items-selector.ellanski.dev)

## Пакеты

| Пакет | Описание | README |
|---|---|---|
| `apps/frontend` | Nuxt 4 SPA — виртуальный скролл, drag & drop, очередь запросов | [→](apps/frontend/README.md) |
| `apps/backend` | Express.js API — состояние в памяти, пагинация, reorder | [→](apps/backend/README.md) |
| `packages/contracts` | OpenAPI-спецификация — единственный источник истины для API | — |
| `packages/api-client` | Генерируемый TypeScript SDK (openapi-fetch) — не редактировать вручную | — |

## Стек

**Frontend** — Nuxt 4 · Vue 3 · TypeScript · TanStack Query · TanStack Virtual · vue-draggable-plus · Pinia · Nuxt UI

**Backend** — Express.js · TypeScript · состояние в памяти (без БД)

**Контракты** — OpenAPI 3.1 · openapi-typescript

## Архитектурные решения

- **Contract-first:** OpenAPI-спецификация — основа всего. Бэкенд реализует её, фронтенд SDK генерируется из неё.
- **Клиентская очередь:** мутации (select, unselect, reorder) батчатся каждые 1с; создание элементов — каждые 10с. Дедупликация через реактивные `Set`.
- **Оптимистичные обновления:** выбранные элементы исчезают из левой панели мгновенно; `hiddenFromLeft` очищается только после серверного подтверждения.
- **Ограниченный поллинг:** отдельный `useQuery` опрашивает только первую страницу раз в 1с (константа — 1 запрос/с) вместо перезапроса всей истории скролла.

## Разработка

```sh
pnpm install
pnpm dev          # запускает frontend (localhost:3000) и backend (localhost:3001)
pnpm generate:api # перегенерировать TypeScript-клиент после изменений контракта
pnpm lint
pnpm build
```

## Деплой

Docker Compose на VDS через Coolify. Перед деплоем задать одну переменную:

```
API_BASE_URL=https://api.your-domain.com
```
