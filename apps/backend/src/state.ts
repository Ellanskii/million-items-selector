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

export function getUnselectedPage(filter: string | undefined, page: number, limit: number): Page {
  const matching: number[] = []
  for (const id of items) {
    if (selected.has(id)) continue
    if (filter !== undefined && !String(id).includes(filter)) continue
    matching.push(id)
  }
  const start = (page - 1) * limit
  return {
    items: matching.slice(start, start + limit).map(id => ({ id })),
    total: matching.length,
    page,
    limit,
  }
}

export function getSelectedPage(filter: string | undefined, page: number, limit: number): Page {
  const filtered = filter !== undefined
    ? order.filter(id => String(id).includes(filter))
    : order.slice()
  const start = (page - 1) * limit
  return {
    items: filtered.slice(start, start + limit).map(id => ({ id })),
    total: filtered.length,
    page,
    limit,
  }
}

export function applySelect(ids: number[]): void {
  for (const id of ids) {
    if (items.has(id) && !selected.has(id)) {
      selected.add(id)
      order.push(id)
    }
  }
}

export function applyUnselect(ids: number[]): void {
  for (const id of ids) {
    if (selected.has(id)) {
      selected.delete(id)
      const idx = order.indexOf(id)
      if (idx !== -1) order.splice(idx, 1)
    }
  }
}

export function applyReorder(newOrder: number[]): boolean {
  if (newOrder.length !== selected.size) return false
  for (const id of newOrder) {
    if (!selected.has(id)) return false
  }
  order.length = 0
  order.push(...newOrder)
  return true
}

export function applyCreate(id: number): boolean {
  if (items.has(id)) return false
  items.add(id)
  return true
}
