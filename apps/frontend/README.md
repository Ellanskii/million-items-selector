[Russian version below](#russian)

# @million-items-selector/frontend

Nuxt 4 SPA for selecting and ordering items from a list of 1,000,000.

## Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 (Vue 3, TypeScript, `ssr: false`) |
| UI kit | Nuxt UI v4 (Tailwind CSS v4) |
| State | Pinia |
| Data fetching | TanStack Query v5 (`useInfiniteQuery`, `useQuery`) |
| Virtual scroll | TanStack Virtual (`useVirtualizer`) |
| Drag & drop | vue-draggable-plus (Sortable.js wrapper for Vue 3) |
| API client | Generated TypeScript SDK (`openapi-fetch` + `openapi-typescript`) |

## Architecture

```
app/
  pages/index.vue         # Layout only — mounts panels, starts polling
  components/
    ItemsPanel.vue        # Left panel: virtual infinite scroll, filter, add item
    SelectedPanel.vue     # Right panel: draggable list, lazy scroll, filter
    AppInfoModal.vue
  stores/items.ts         # Pinia: mutation queue + optimistic state
  composables/useSync.ts  # Flushes queue every 1s; invalidates queries after mutations
  plugins/
    vue-query.client.ts   # QueryClient setup
    api-config.ts         # Wires NUXT_PUBLIC_API_BASE into the generated client
```

### Request budget

| Source | Requests/s |
|---|---|
| Items page 1 poll (`useQuery`, `refetchInterval: 1000`) | 1 |
| Selected list poll (`useInfiniteQuery`, `refetchInterval: 1000`) | 1–N (N = loaded pages, typically 1) |
| After mutations | +N burst (all loaded items pages), then back to baseline |

### Queue

User actions are enqueued in Pinia and flushed in batches:
- **select / unselect / reorder** — every **1 second**
- **custom item creation** — every **10 seconds**

Deduplication: a pending `select` cancels a pending `unselect` for the same ID and vice versa. Duplicate selects are collapsed by a reactive `Set`.

### Optimistic updates

On `select(id)`:
- Item is immediately hidden from the left panel via `hiddenFromLeft` set.
- `hiddenFromLeft` is cleared only when the server confirms the item is gone (not on flush timing), preventing flicker.

On `unselect(id)`:
- Item is immediately removed from `localOrder` in `SelectedPanel`.

## Dev

```sh
pnpm dev:frontend       # from monorepo root
```

Runs on `http://localhost:3000`.  
Expects backend at `http://localhost:3001` (override with `NUXT_PUBLIC_API_BASE`).

## Build

```sh
pnpm --filter @million-items-selector/frontend build
```

Output: `apps/frontend/.output` — self-contained Nitro server.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3001` | Public URL of the backend API |

Set at container start time — no rebuild required.

---

## Deviations from the test assignment

### 1. Right panel is not virtualized

**Requirement:** both panels should have infinite scroll; no full DOM rendering of large lists.

**Reality:** the right panel renders all loaded items directly in the DOM.

**Why:** drag & drop (Sortable.js) requires real DOM nodes to exist for all draggable items. Virtual scroll evicts off-screen nodes, making it impossible to drag an item to a position outside the visible viewport. This is a fundamental incompatibility — every major UI library faces it.

**Mitigation:** the selected list is user-curated and bounded in practice. Infinite scroll still works (pages load on scroll), just without DOM virtualization. The left panel (read-only, 1M items) keeps full virtual scroll.

---

### 2. Right panel filter is client-side

**Requirement:** both panels should filter by ID.

**Reality:** the right panel query does not pass the filter to the server. Filtering is applied locally on `localOrder`.

**Why:** `POST /reorder` needs to know the full order of all selected items. Server-side filtering would mean the client only has the filtered subset, making it impossible to reconstruct the complete order after a drag. Keeping all selected items in `localOrder` client-side lets us correctly merge a filtered drag back into the full order.

---

### 3. `POST /reorder` uses `{ id, afterId }` instead of a full ordered list

**Requirement:** not specified — the test assignment only says order should be persisted.

**Reality:** instead of sending the complete order array, the API accepts `{ id: number, afterId: number | null }` — "place item `id` immediately after `afterId`".

**Why:** a full-list reorder API requires the client to hold all selected items before any drag can be sent. With infinite scroll, that means eagerly loading every page of the selected list just to support reorder — which contradicts the lazy-loading requirement. The positional approach sends one atomic move and works correctly with any number of items loaded.

---

---

# Russian

# @million-items-selector/frontend

Nuxt 4 SPA для выбора и сортировки элементов из списка в 1 000 000 позиций.

## Стек

| Слой | Выбор |
|---|---|
| Фреймворк | Nuxt 4 (Vue 3, TypeScript, `ssr: false`) |
| UI-кит | Nuxt UI v4 (Tailwind CSS v4) |
| Состояние | Pinia |
| Загрузка данных | TanStack Query v5 (`useInfiniteQuery`, `useQuery`) |
| Виртуальный скролл | TanStack Virtual (`useVirtualizer`) |
| Drag & drop | vue-draggable-plus (Sortable.js wrapper для Vue 3) |
| API-клиент | Генерируемый TypeScript SDK (`openapi-fetch` + `openapi-typescript`) |

## Архитектура

```
app/
  pages/index.vue         # Только лейаут — монтирует панели, запускает поллинг
  components/
    ItemsPanel.vue        # Левая панель: виртуальный инфинити-скролл, фильтр, добавление
    SelectedPanel.vue     # Правая панель: перетаскиваемый список, ленивая загрузка, фильтр
    AppInfoModal.vue
  stores/items.ts         # Pinia: очередь мутаций + оптимистичное состояние
  composables/useSync.ts  # Флашит очередь каждую 1с; инвалидирует запросы после мутаций
  plugins/
    vue-query.client.ts   # Настройка QueryClient
    api-config.ts         # Передаёт NUXT_PUBLIC_API_BASE в сгенерированный клиент
```

### Бюджет запросов

| Источник | Запросов/с |
|---|---|
| Поллинг страницы 1 элементов (`useQuery`, `refetchInterval: 1000`) | 1 |
| Поллинг выбранных (`useInfiniteQuery`, `refetchInterval: 1000`) | 1–N (N = загружено страниц, обычно 1) |
| После мутаций | +N burst (все загруженные страницы), потом возврат к базе |

### Очередь

Действия пользователя накапливаются в Pinia и отправляются батчами:
- **select / unselect / reorder** — каждую **1 секунду**
- **создание кастомного элемента** — каждые **10 секунд**

Дедупликация: pending `select` отменяет pending `unselect` для того же ID и наоборот. Повторные выборы одного элемента схлопываются через реактивный `Set`.

### Оптимистичные обновления

При `select(id)`:
- Элемент немедленно скрывается из левой панели через `hiddenFromLeft`.
- `hiddenFromLeft` очищается только когда сервер подтверждает исчезновение элемента — не по таймингу флаша, что исключает моргание.

При `unselect(id)`:
- Элемент немедленно удаляется из `localOrder` в `SelectedPanel`.

## Разработка

```sh
pnpm dev:frontend       # из корня монорепо
```

Запускается на `http://localhost:3000`.  
Ожидает бэкенд на `http://localhost:3001` (переопределяется через `NUXT_PUBLIC_API_BASE`).

## Сборка

```sh
pnpm --filter @million-items-selector/frontend build
```

Результат: `apps/frontend/.output` — самодостаточный Nitro-сервер.

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3001` | Публичный URL бэкенда |

Задаётся при старте контейнера — пересборка не нужна.

---

## Расхождения с тестовым заданием

### 1. Правая панель не виртуализирована

**Требование:** обе панели — инфинити-скролл без полного рендера DOM.

**Реальность:** правая панель рендерит все загруженные элементы напрямую в DOM.

**Почему:** drag & drop (Sortable.js) требует, чтобы все перетаскиваемые DOM-узлы существовали. Виртуальный скролл удаляет невидимые узлы, из-за чего невозможно перетащить элемент за пределы viewport. Это фундаментальная несовместимость, с которой сталкивается любая библиотека.

**Компенсация:** список выбранных — пользовательский и ограничен по размеру на практике. Инфинити-скролл сохраняется (страницы загружаются при прокрутке), просто без DOM-виртуализации. Левая панель (read-only, 1M элементов) использует полный виртуальный скролл.

---

### 2. Фильтр правой панели — клиентский

**Требование:** обе панели должны фильтровать по ID.

**Реальность:** запрос правой панели не передаёт фильтр на сервер. Фильтрация применяется локально к `localOrder`.

**Почему:** `POST /reorder` требует знать полный порядок всех выбранных элементов. Серверная фильтрация означала бы, что на клиенте есть только отфильтрованное подмножество, и восстановить полный порядок после перетаскивания было бы невозможно. Хранение всех выбранных элементов в `localOrder` позволяет корректно вмёрджить результат drag во отфильтрованном виде обратно в полный порядок.

---

### 3. `POST /reorder` использует `{ id, afterId }` вместо полного списка

**Требование:** не специфицировано — ТЗ говорит только о сохранении порядка.

**Реальность:** вместо передачи полного массива порядка API принимает `{ id: number, afterId: number | null }` — «поставить элемент `id` сразу после `afterId`».

**Почему:** API с полным списком обязывает клиента иметь все выбранные элементы перед отправкой reorder, то есть жадно загружать все страницы выбранных — что противоречит требованию ленивой загрузки. Позиционный подход отправляет одну атомарную операцию и работает корректно при любом количестве загруженных элементов.
