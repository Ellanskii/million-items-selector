import { api } from '@million-items-selector/api-client'

export const useItemsStore = defineStore('items', () => {
  const pendingSelects = reactive(new Set<number>())
  const pendingUnselects = reactive(new Set<number>())
  // Separate visual state: items hidden from the left panel until server confirms selection.
  // Cleared only when allItems no longer contains the id (not tied to flush timing).
  const hiddenFromLeft = reactive(new Set<number>())
  let pendingReorder: number[] | null = null
  const pendingCreates = new Set<number>()
  let flushing = false

  function select(id: number) {
    pendingUnselects.delete(id)
    pendingSelects.add(id)
    hiddenFromLeft.add(id)
  }

  function unselect(id: number) {
    pendingSelects.delete(id)
    pendingUnselects.add(id)
    hiddenFromLeft.delete(id)
  }

  function reorder(newOrder: number[]) {
    pendingReorder = newOrder
  }

  function enqueueCreate(id: number): string | null {
    if (pendingCreates.has(id)) return `Item ${id} is already queued`
    pendingCreates.add(id)
    return null
  }

  async function flushMutations() {
    if (flushing) return
    flushing = true
    try {
      const selects = [...pendingSelects]
      const unselects = [...pendingUnselects]
      const reorderOp = pendingReorder
      pendingSelects.clear()
      pendingUnselects.clear()
      pendingReorder = null

      await Promise.all([
        selects.length ? api.POST('/select', { body: { ids: selects } }) : Promise.resolve(),
        unselects.length ? api.POST('/unselect', { body: { ids: unselects } }) : Promise.resolve(),
        reorderOp ? api.POST('/reorder', { body: { order: reorderOp } }) : Promise.resolve(),
      ])
    } finally {
      flushing = false
    }
  }

  async function flushCreates() {
    if (pendingCreates.size === 0) return
    const batch = [...pendingCreates]
    pendingCreates.clear()
    await Promise.all(batch.map(id => api.POST('/items', { body: { id } })))
  }

  return { select, unselect, reorder, enqueueCreate, flushMutations, flushCreates, pendingSelects, pendingUnselects, hiddenFromLeft }
})
