[Русская версия](#русская-версия)

# @million-items-selector/backend

Express.js API server for the Million Items Selector. Manages in-memory state for 1,000,000 items with pagination, filtering, selection, and drag-and-drop reordering.

## Features

- 1,000,000 items initialized in memory at startup
- Server-side pagination (default page size: 20, max: 100)
- Substring filter by item id
- Selection state with preserved order
- Mutation queue: deduplicates and batches operations every 1s
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

## Queue behavior

`POST /select`, `POST /unselect`, and `POST /reorder` return `200` immediately and are applied to state within ~1s. `GET` endpoints always reflect committed state. Design your frontend with optimistic updates accordingly.

Deduplication rules within a batch window:
- Consecutive selects / unselects for the same type are merged by id
- Multiple reorders collapse into the last one

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
- Очередь мутаций: дедупликация и батчинг операций каждые 1s
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

## Поведение очереди

`POST /select`, `POST /unselect` и `POST /reorder` возвращают `200` немедленно, а сами операции применяются к состоянию в течение ~1s. `GET`-эндпоинты всегда возвращают зафиксированное состояние. Фронтенд должен использовать оптимистичные обновления.

Правила дедупликации в рамках одного батча:
- Последовательные select / unselect одного типа объединяются по id
- Несколько reorder схлопываются в последний

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
