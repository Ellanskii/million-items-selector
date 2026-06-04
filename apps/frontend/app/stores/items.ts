import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const QUEUE_FLUSH_DELAY = 1100

export const useItemsStore = defineStore('items', () => {
  const items = ref<{ id: number }[]>([])
  const selected = ref<{ id: number }[]>([])
  const totalUnselected = ref(0)
  const page = ref(1)
  const filter = ref('')
  const selectedFilter = ref('')

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

  async function select(id: number) {
    await api.POST('/select', { body: { ids: [id] } })
    setTimeout(refresh, QUEUE_FLUSH_DELAY)
  }

  async function unselect(id: number) {
    await api.POST('/unselect', { body: { ids: [id] } })
    setTimeout(refresh, QUEUE_FLUSH_DELAY)
  }

  async function createItem(id: number): Promise<string | null> {
    const { error } = await api.POST('/items', { body: { id } })
    if (error) return (error as { message?: string }).message ?? 'Error'
    await fetchItems()
    return null
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
    refresh, select, unselect, createItem,
    prevPage, nextPage,
  }
})
