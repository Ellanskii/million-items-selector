[Русская версия](#русская-версия)

# @million-items-selector/backend

Express.js API server for the Million Items Selector. Manages in-memory state for 1,000,000 items with pagination, filtering, selection, and drag-and-drop reordering.

## Features

- 1,000,000 items initialized in memory at startup
- Server-side pagination (default page size: 20, max: 100)
- Substring filter by item id
- Selection state with preserved order
- Custom item creation via `POST /items`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/items` | Paginated list of unselected items |
| `POST` | `/items` | Create a custom item |
| `GET` | `/selected` | Paginated list of selected items in order |
| `POST` | `/select` | Add items to selection |
| `POST` | `/unselect` | Remove items from selection |
| `POST` | `/reorder` | Set the full order of selected items |

Query params for `GET` endpoints: `page`, `limit`, `filter`.

Full schema: [`packages/contracts/openapi.yaml`](../../packages/contracts/openapi.yaml).

## State & idempotency

All mutations are applied synchronously and respond immediately. Idempotency is
enforced in state functions — selecting an already-selected item or unselecting
a non-selected item is a no-op. No queue, no deferred processing.

The request queue with deduplication and batching lives on the frontend
(`app/stores/items.ts`).

## Testing

Unit tests cover `src/state.ts` — all pure state functions including edge cases
for `applyReorder`, pagination, filtering, and idempotency.

```sh
pnpm test                                             # from monorepo root
pnpm --filter @million-items-selector/backend test    # direct (single run)
pnpm --filter @million-items-selector/backend test:watch  # watch mode
```

## Development

```sh
pnpm dev:backend        # from monorepo root
pnpm --filter @million-items-selector/backend dev   # direct
```

Runs on `http://localhost:3001` by default. Override with the `PORT` env variable.

## Build

```sh
pnpm --filter @million-items-selector/backend build
node dist/index.js
```

---

## Русская версия

# @million-items-selector/backend

Express.js API-сервер. Управляет состоянием в памяти: 1 000 000 элементов с пагинацией, фильтрацией, выделением и сортировкой перетаскиванием.

## Возможности

- 1 000 000 элементов инициализируются в памяти при старте
- Серверная пагинация (размер страницы по умолчанию: 20, максимум: 100)
- Фильтрация по подстроке id
- Состояние выбора с сохранением порядка
- Создание произвольных элементов через `POST /items`

## Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/items` | Постраничный список невыбранных элементов |
| `POST` | `/items` | Создать произвольный элемент |
| `GET` | `/selected` | Постраничный список выбранных элементов в текущем порядке |
| `POST` | `/select` | Добавить элементы в выборку |
| `POST` | `/unselect` | Убрать элементы из выборки |
| `POST` | `/reorder` | Задать полный порядок выбранных элементов |

Query-параметры для `GET`-запросов: `page`, `limit`, `filter`.

Полная схема: [`packages/contracts/openapi.yaml`](../../packages/contracts/openapi.yaml).

## Состояние и идемпотентность

Все мутации применяются синхронно, ответ возвращается немедленно. Идемпотентность
обеспечивается на уровне state-функций — повторный select уже выбранного элемента
или unselect невыбранного являются no-op. Очередей и отложенной обработки нет.

Очередь запросов с дедупликацией и батчингом реализована на фронтенде
(`app/stores/items.ts`).

## Тесты

Юнит-тесты покрывают `src/state.ts` — все чистые state-функции, включая
edge cases для `applyReorder`, пагинацию, фильтрацию и идемпотентность.

```sh
pnpm test                                             # из корня монорепо
pnpm --filter @million-items-selector/backend test    # напрямую (однократный запуск)
pnpm --filter @million-items-selector/backend test:watch  # режим наблюдения
```

## Разработка

```sh
pnpm dev:backend        # из корня монорепо
pnpm --filter @million-items-selector/backend dev   # напрямую
```

По умолчанию запускается на `http://localhost:3001`. Переопределяется переменной окружения `PORT`.

## Сборка

```sh
pnpm --filter @million-items-selector/backend build
node dist/index.js
```
