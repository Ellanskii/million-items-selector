const TOTAL_ITEMS = 1_000_000

export const items = new Set<number>()
for (let i = 1; i <= TOTAL_ITEMS; i++) items.add(i)

export const selected = new Set<number>()
export const order: number[] = []

export interface Page {
  items: { id: number }[]
  total: number
  page: number
  limit: number
}

// Version-based cache: bumped on every mutation so polls get O(1) hits
// between mutations instead of repeating the full O(n) scan each second.
let mutationVersion = 0
const unselectedCache = new Map<string, { version: number; result: Page }>()
const selectedCache = new Map<string, { version: number; result: Page }>()

function bumpVersion() {
  mutationVersion++
  // Don't clear maps — entries self-invalidate via version check
}

export function resetStateForTesting() {
  mutationVersion++
  unselectedCache.clear()
  selectedCache.clear()
}

export function getUnselectedPage(filter: string | undefined, page: number, limit: number): Page {
  const key = `${filter ?? ''}:${page}:${limit}`
  const cached = unselectedCache.get(key)
  if (cached?.version === mutationVersion) return cached.result

  const start = (page - 1) * limit
  const result: number[] = []
  let total = 0

  for (const id of items) {
    if (selected.has(id)) continue
    if (filter !== undefined && !String(id).includes(filter)) continue
    if (total >= start && result.length < limit) result.push(id)
    total++
  }

  const pageResult: Page = { items: result.map(id => ({ id })), total, page, limit }
  unselectedCache.set(key, { version: mutationVersion, result: pageResult })
  return pageResult
}

export function getSelectedPage(filter: string | undefined, page: number, limit: number): Page {
  const key = `${filter ?? ''}:${page}:${limit}`
  const cached = selectedCache.get(key)
  if (cached?.version === mutationVersion) return cached.result

  const filtered = filter !== undefined
    ? order.filter(id => String(id).includes(filter))
    : order.slice()
  const start = (page - 1) * limit
  const pageResult: Page = {
    items: filtered.slice(start, start + limit).map(id => ({ id })),
    total: filtered.length,
    page,
    limit,
  }
  selectedCache.set(key, { version: mutationVersion, result: pageResult })
  return pageResult
}

export function applySelect(ids: number[]): void {
  for (const id of ids) {
    if (items.has(id) && !selected.has(id)) {
      selected.add(id)
      order.push(id)
    }
  }
  bumpVersion()
}

export function applyUnselect(ids: number[]): void {
  for (const id of ids) {
    if (selected.has(id)) {
      selected.delete(id)
      const idx = order.indexOf(id)
      if (idx !== -1) order.splice(idx, 1)
    }
  }
  bumpVersion()
}

export function applyReorder(id: number, afterId: number | null): boolean {
  if (!selected.has(id)) return false
  if (afterId !== null && !selected.has(afterId)) return false
  if (afterId === id) return false
  const idx = order.indexOf(id)
  if (idx === -1) return false
  order.splice(idx, 1)
  if (afterId === null) {
    order.unshift(id)
  } else {
    const afterIdx = order.indexOf(afterId)
    if (afterIdx === -1) return false
    order.splice(afterIdx + 1, 0, id)
  }
  bumpVersion()
  return true
}

export function applyCreate(id: number): boolean {
  if (items.has(id)) return false
  items.add(id)
  bumpVersion()
  return true
}
