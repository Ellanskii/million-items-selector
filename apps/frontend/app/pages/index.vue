<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { VueDraggable } from 'vue-draggable-plus'
import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const ROW_HEIGHT = 44

const store = useItemsStore()
const { startPolling } = useSync()
const toast = useToast()

const leftFilter = ref('')
const rightFilter = ref('')
const newItemId = ref<number | null>(null)

// ---- Left panel: unselected items (virtual scroll) ----

const {
  data: itemsData,
  fetchNextPage: fetchMoreItems,
  hasNextPage: hasMoreItems,
  isFetchingNextPage: loadingMoreItems,
} = useInfiniteQuery({
  queryKey: computed(() => ['items', leftFilter.value]),
  queryFn: ({ pageParam }) =>
    api.GET('/items', {
      params: { query: { page: pageParam as number, limit: LIMIT, filter: leftFilter.value || undefined } },
    }).then(r => r.data!),
  initialPageParam: 1,
  getNextPageParam: (last) => last.page * LIMIT < last.total ? last.page + 1 : undefined,
  maxPages: 3,
  refetchInterval: 1_000,
})

const allItems = computed(() => itemsData.value?.pages.flatMap(p => p.items) ?? [])

// Hide items optimistically; cleared only when server confirms (item gone from allItems)
const displayedItems = computed(() =>
  allItems.value.filter(item => !store.hiddenFromLeft.has(item.id))
)

watch(allItems, (items) => {
  if (store.pendingSelects.size > 0 || store.pendingUnselects.size > 0) return
  const ids = new Set(items.map(i => i.id))
  for (const id of store.hiddenFromLeft) {
    if (!ids.has(id)) store.hiddenFromLeft.delete(id)
  }
})

const leftParent = ref<HTMLElement | null>(null)

const leftVirtualizer = useVirtualizer(computed(() => ({
  count: displayedItems.value.length,
  getScrollElement: () => leftParent.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
})))

watchEffect(() => {
  const rows = leftVirtualizer.value.getVirtualItems()
  const last = rows[rows.length - 1]
  if (!last) return
  if (last.index >= displayedItems.value.length - 1 && hasMoreItems.value && !loadingMoreItems.value)
    fetchMoreItems()
})

// ---- Right panel: selected items (drag & drop, no virtual scroll) ----

const {
  data: selectedData,
  fetchNextPage: fetchMoreSelected,
  hasNextPage: hasMoreSelected,
  isFetchingNextPage: loadingMoreSelected,
} = useInfiniteQuery({
  // no filter in queryKey — filter is applied client-side to preserve full order for reorder
  queryKey: ['selected'] as const,
  queryFn: ({ pageParam }) =>
    api.GET('/selected', {
      params: { query: { page: pageParam as number, limit: LIMIT } },
    }).then(r => r.data!),
  initialPageParam: 1,
  getNextPageParam: (last) => last.page * LIMIT < last.total ? last.page + 1 : undefined,
  refetchInterval: 1_000,
})

// Eagerly load all selected pages so reorder always has the full list
watchEffect(() => {
  if (hasMoreSelected.value && !loadingMoreSelected.value) fetchMoreSelected()
})

// localOrder — source of truth for drag order, seeded from server
// localDisplay — what vuedraggable is bound to (filtered or full)
const localOrder = ref<{ id: number }[]>([])
const localDisplay = ref<{ id: number }[]>([])
const isDragging = ref(false)
let syncFrozen = false

watch(
  () => selectedData.value?.pages,
  (pages) => {
    if (!pages || isDragging.value || syncFrozen) return
    // Don't overwrite optimistic state while mutations are still pending
    if (store.pendingSelects.size > 0 || store.pendingUnselects.size > 0) return
    localOrder.value = pages.flatMap(p => p.items)
  },
  { deep: true, immediate: true },
)

function handleSelect(item: { id: number }) {
  store.select(item.id)
  if (!localOrder.value.find(i => i.id === item.id))
    localOrder.value = [...localOrder.value, item]
}

function handleUnselect(id: number) {
  store.unselect(id)
  localOrder.value = localOrder.value.filter(item => item.id !== id)
}

// Recompute display when order or filter changes (not during drag)
watch(
  [localOrder, rightFilter],
  () => {
    if (isDragging.value) return
    localDisplay.value = rightFilter.value
      ? localOrder.value.filter(item => String(item.id).includes(rightFilter.value))
      : [...localOrder.value]
  },
  { immediate: true },
)

function onDragEnd() {
  isDragging.value = false
  // Freeze server sync for 2s so the next refetch doesn't overwrite local drag
  syncFrozen = true
  setTimeout(() => { syncFrozen = false }, 2_000)

  if (!rightFilter.value) {
    localOrder.value = [...localDisplay.value]
  } else {
    // Merge filtered drag result back into full order:
    // filtered items keep their relative positions in localOrder, just reordered among themselves
    const filteredPositions = localOrder.value
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => String(item.id).includes(rightFilter.value))
      .map(({ idx }) => idx)

    const newOrder = [...localOrder.value]
    filteredPositions.forEach((pos, i) => { newOrder[pos] = localDisplay.value[i]! })
    localOrder.value = newOrder
  }

  store.reorder(localOrder.value.map(item => item.id))
}

// ---- Create form ----

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

onMounted(() => startPolling())
</script>

<template>
  <div class="min-h-screen bg-default p-6">
    <div class="max-w-6xl mx-auto space-y-4">

      <h1 class="text-2xl font-bold">Million Items Selector</h1>

      <div class="grid grid-cols-2 gap-6">

        <!-- Left panel: all unselected items -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Items</span>
              <UBadge variant="subtle">{{ allItems.length }} loaded</UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <UInput
              v-model="leftFilter"
              placeholder="Filter by id…"
              leading-icon="i-lucide-search"
            />

            <div ref="leftParent" class="overflow-y-auto h-[500px]">
              <div :style="{ height: `${leftVirtualizer.getTotalSize()}px`, position: 'relative' }">
                <div
                  v-for="row in leftVirtualizer.getVirtualItems()"
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

            <p v-if="loadingMoreItems" class="text-sm text-center text-muted py-1">Loading…</p>
          </div>

          <template #footer>
            <form class="flex gap-2" @submit.prevent="handleCreate">
              <UInput
                v-model.number="newItemId"
                type="number"
                placeholder="Custom item id"
                class="flex-1"
              />
              <UButton type="submit" leading-icon="i-lucide-plus">Add</UButton>
            </form>
          </template>
        </UCard>

        <!-- Right panel: selected items with drag & drop -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Selected</span>
              <UBadge color="success" variant="subtle">{{ localOrder.length }}</UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <UInput
              v-model="rightFilter"
              placeholder="Filter by id…"
              leading-icon="i-lucide-search"
            />

            <div class="overflow-y-auto h-[500px]">
              <VueDraggable
                v-model="localDisplay"
                handle=".drag-handle"
                @start="isDragging = true"
                @end="onDragEnd"
              >
                <div
                  v-for="item in localDisplay"
                  :key="item.id"
                  class="flex items-center gap-2 px-1 border-b border-default"
                  :style="{ height: `${ROW_HEIGHT}px` }"
                >
                  <span class="drag-handle cursor-grab text-muted select-none">⠿</span>
                  <span class="tabular-nums flex-1">{{ item.id }}</span>
                  <UButton
                    size="xs"
                    variant="subtle"
                    color="error"
                    @click="handleUnselect(item.id)"
                  >
                    Remove
                  </UButton>
                </div>
              </VueDraggable>

              <p v-if="loadingMoreSelected" class="text-sm text-center text-muted py-2">Loading…</p>
            </div>

            <p v-if="localDisplay.length === 0 && !loadingMoreSelected"
               class="text-sm text-muted text-center py-4">
              No items selected
            </p>
          </div>
        </UCard>

      </div>
    </div>
  </div>
</template>
