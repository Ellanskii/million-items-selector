import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const QUEUE_FLUSH_DELAY = 1100

export const useItemsStore = defineStore('items', () => {
  const items = ref<{ id: number }[]>([])
  const selected = ref<{ id: number }[]>([])
  const totalUnselected = ref(0)
  const page = ref(1)

  async function fetchItems() {
    const { data } = await api.GET('/items', {
      params: { query: { page: page.value, limit: LIMIT } },
    })
    if (data) {
      items.value = data.items
      totalUnselected.value = data.total
    }
  }

  async function fetchSelected() {
    const { data } = await api.GET('/selected', {
      params: { query: { page: 1, limit: LIMIT } },
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

  function prevPage() {
    if (page.value > 1) { page.value--; fetchItems() }
  }

  function nextPage() {
    page.value++; fetchItems()
  }

  return { items, selected, totalUnselected, page, LIMIT, refresh, select, unselect, prevPage, nextPage }
})
