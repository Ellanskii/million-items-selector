import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const SYNC_INTERVAL = 1_000
const CREATE_INTERVAL = 10_000

export const useItemsStore = defineStore('items', () => {
  const items = ref<{ id: number }[]>([])
  const selected = ref<{ id: number }[]>([])
  const totalUnselected = ref(0)
  const page = ref(1)
  const filter = ref('')
  const selectedFilter = ref('')

  // Queue state — non-reactive internal buffers
  const pendingSelects = new Set<number>()
  const pendingUnselects = new Set<number>()
  let pendingReorder: number[] | null = null
  const pendingCreates = new Set<number>()
  let flushing = false

  async function fetchItems() {
    const { data } = await api.GET('/items', {
      params: { query: { page: page.value, limit: LIMIT, filter: filter.value || undefined } },
    })
    if (data) {
      items.value = data.items
      totalUnselected.value = data.total
    }
  }

  async function fetchSelected() {
    const { data } = await api.GET('/selected', {
      params: { query: { page: 1, limit: LIMIT, filter: selectedFilter.value || undefined } },
    })
    if (data) selected.value = data.items
  }

  async function refresh() {
    await Promise.all([fetchItems(), fetchSelected()])
  }

  // Enqueue — deduplicate by cancelling opposite pending op
  function select(id: number) {
    pendingUnselects.delete(id)
    pendingSelects.add(id)
  }

  function unselect(id: number) {
    pendingSelects.delete(id)
    pendingUnselects.add(id)
  }

  function reorder(newOrder: number[]) {
    pendingReorder = newOrder
  }

  function enqueueCreate(id: number): string | null {
    if (pendingCreates.has(id)) return `Item ${id} is already queued`
    pendingCreates.add(id)
    return null
  }

  // Flush mutations + sync every 1s
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
      await refresh()
    } finally {
      flushing = false
    }
  }

  // Flush creates every 10s
  async function flushCreates() {
    if (pendingCreates.size === 0) return
    const batch = [...pendingCreates]
    pendingCreates.clear()
    await Promise.all(batch.map(id => api.POST('/items', { body: { id } })))
    await fetchItems()
  }

  let pollingStarted = false
  function startPolling() {
    if (pollingStarted) return
    pollingStarted = true
    setInterval(flushMutations, SYNC_INTERVAL)
    setInterval(flushCreates, CREATE_INTERVAL)
  }

  watch(filter, () => { page.value = 1; fetchItems() })
  watch(selectedFilter, () => fetchSelected())
  watch(page, () => fetchItems())

  function prevPage() { if (page.value > 1) page.value-- }
  function nextPage() { page.value++ }

  const totalPages = computed(() => Math.ceil(totalUnselected.value / LIMIT))

  return {
    items, selected, totalUnselected, totalPages,
    page, filter, selectedFilter,
    refresh, startPolling,
    select, unselect, reorder, enqueueCreate,
    prevPage, nextPage,
  }
})
