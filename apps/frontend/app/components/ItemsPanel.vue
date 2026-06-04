<script setup lang="ts">
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/vue-query'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const ROW_HEIGHT = 44

const store = useItemsStore()
const toast = useToast()
const queryClient = useQueryClient()

const filter = ref('')
const newItemId = ref<number | null>(null)

// Infinite query accumulates pages as user scrolls — no refetchInterval to avoid N req/s growth
const {
  data: itemsData,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: computed(() => ['items', filter.value]),
  queryFn: ({ pageParam }) =>
    api.GET('/items', {
      params: { query: { page: pageParam as number, limit: LIMIT, filter: filter.value || undefined } },
    }).then(r => r.data!),
  initialPageParam: 1,
  getNextPageParam: (last) => last.page * LIMIT < last.total ? last.page + 1 : undefined,
})

// Polls only page 1 every 1s — satisfies ТЗ "getting data every 1s" at a fixed 1 req/s cost
const { data: page1 } = useQuery({
  queryKey: computed(() => ['items-p1', filter.value]),
  queryFn: () => api.GET('/items', {
    params: { query: { page: 1, limit: LIMIT, filter: filter.value || undefined } },
  }).then(r => r.data!),
  refetchInterval: 1_000,
  staleTime: 0,
})

// Sync fresh page 1 data into the infinite query cache
watch(page1, (fresh) => {
  if (!fresh) return
  const key = ['items', filter.value]
  const cached = queryClient.getQueryData<InfiniteData<typeof fresh>>(key)
  if (!cached) return
  queryClient.setQueryData(key, { ...cached, pages: [fresh, ...cached.pages.slice(1)] })
})

const allItems = computed(() => itemsData.value?.pages.flatMap(p => p.items) ?? [])
const total = computed(() => page1.value?.total ?? itemsData.value?.pages[0]?.total ?? 0)

const displayedItems = computed(() =>
  allItems.value.filter(item => !store.hiddenFromLeft.has(item.id))
)

// Clean up hiddenFromLeft once server confirms item is gone from the list
watch(allItems, (items) => {
  if (store.pendingSelects.size > 0 || store.pendingUnselects.size > 0) return
  const ids = new Set(items.map(i => i.id))
  for (const id of store.hiddenFromLeft) {
    if (!ids.has(id)) store.hiddenFromLeft.delete(id)
  }
})

const parent = ref<HTMLElement | null>(null)

const virtualizer = useVirtualizer(computed(() => ({
  count: displayedItems.value.length,
  getScrollElement: () => parent.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
})))

watchEffect(() => {
  const rows = virtualizer.value.getVirtualItems()
  const last = rows[rows.length - 1]
  if (!last) return
  if (last.index >= displayedItems.value.length - 1 && hasNextPage.value && !isFetchingNextPage.value)
    fetchNextPage()
})

function handleSelect(item: { id: number }) {
  store.select(item.id)
}

function handleCreate() {
  if (!newItemId.value) return
  const err = store.enqueueCreate(newItemId.value)
  if (err) {
    toast.add({ title: 'Error', description: err, color: 'error' })
  } else {
    toast.add({ title: `Item ${newItemId.value} queued`, description: 'Will be added within 10s', color: 'success' })
    newItemId.value = null
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-semibold">Items</span>
        <UBadge variant="subtle">{{ total }}</UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <UInput v-model="filter" placeholder="Filter by id…" leading-icon="i-lucide-search" />

      <div ref="parent" class="overflow-y-auto h-[500px]">
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
          <div
            v-for="row in virtualizer.getVirtualItems()"
            :key="row.key"
            :style="{
              position: 'absolute',
              top: 0,
              width: '100%',
              transform: `translateY(${row.start}px)`,
              height: `${row.size}px`,
            }"
            class="flex items-center justify-between px-1 border-b border-default"
          >
            <span class="tabular-nums">{{ displayedItems[row.index]?.id }}</span>
            <UButton size="xs" variant="subtle" @click="handleSelect(displayedItems[row.index]!)">
              Select
            </UButton>
          </div>
        </div>
      </div>

      <p v-if="isFetchingNextPage" class="text-sm text-center text-muted py-1">Loading…</p>
    </div>

    <template #footer>
      <form class="flex gap-2" @submit.prevent="handleCreate">
        <UInput v-model.number="newItemId" type="number" placeholder="Custom item id" class="flex-1" />
        <UButton type="submit" leading-icon="i-lucide-plus">Add</UButton>
      </form>
    </template>
  </UCard>
</template>
