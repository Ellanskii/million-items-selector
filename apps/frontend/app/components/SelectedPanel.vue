<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'
import { VueDraggable } from 'vue-draggable-plus'
import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const ROW_HEIGHT = 44

const store = useItemsStore()

const filter = ref('')

const {
  data: selectedData,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isError: selectedError,
} = useInfiniteQuery({
  queryKey: ['selected'] as const,
  queryFn: ({ pageParam }) =>
    api.GET('/selected', {
      params: { query: { page: pageParam as number, limit: LIMIT } },
    }).then(r => r.data!),
  initialPageParam: 1,
  getNextPageParam: (last) => last.page * LIMIT < last.total ? last.page + 1 : undefined,
  refetchInterval: 1_000,
})

// Lazy-load next page when sentinel scrolls into view
const loadTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && hasNextPage.value && !isFetchingNextPage.value)
      fetchNextPage()
  }, { threshold: 0.1 })
  if (loadTrigger.value) observer.observe(loadTrigger.value)
})
onUnmounted(() => observer?.disconnect())

const total = computed(() => selectedData.value?.pages[0]?.total ?? 0)

// localOrder — source of truth for drag order, seeded from server
// localDisplay — what VueDraggable is bound to (filtered or full view)
const localOrder = ref<{ id: number }[]>([])
const localDisplay = ref<{ id: number }[]>([])
const isDragging = ref(false)
let syncFrozen = false

watch(
  () => selectedData.value?.pages,
  (pages) => {
    if (!pages || isDragging.value || syncFrozen) return
    if (store.pendingSelects.size > 0 || store.pendingUnselects.size > 0) return
    localOrder.value = pages.flatMap(p => p.items)
  },
  { deep: true, immediate: true },
)

watch(
  [localOrder, filter],
  () => {
    if (isDragging.value) return
    localDisplay.value = filter.value
      ? localOrder.value.filter(item => String(item.id).includes(filter.value))
      : [...localOrder.value]
  },
  { immediate: true },
)

function handleUnselect(id: number) {
  store.unselect(id)
  localOrder.value = localOrder.value.filter(item => item.id !== id)
}

function onDragEnd(event: { newIndex?: number }) {
  isDragging.value = false
  syncFrozen = true
  setTimeout(() => { syncFrozen = false }, 2_000)

  const newIndex = event.newIndex ?? 0
  const movedItem = localDisplay.value[newIndex]
  if (!movedItem) return

  const afterId = newIndex > 0 ? (localDisplay.value[newIndex - 1]?.id ?? null) : null

  const id = movedItem.id
  const ids = localOrder.value.map(i => i.id).filter(i => i !== id)
  if (afterId === null) {
    ids.unshift(id)
  } else {
    const afterIdx = ids.indexOf(afterId)
    if (afterIdx !== -1) ids.splice(afterIdx + 1, 0, id)
  }
  localOrder.value = ids.map(i => ({ id: i }))

  store.reorder(id, afterId)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-semibold">Selected</span>
        <UBadge color="success" variant="subtle">{{ total }}</UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <UInput v-model="filter" placeholder="Filter by id…" leading-icon="i-lucide-search" />

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
            <UButton size="xs" variant="subtle" color="error" @click="handleUnselect(item.id)">
              Remove
            </UButton>
          </div>
        </VueDraggable>

        <div ref="loadTrigger" class="h-1" />
        <p v-if="isFetchingNextPage" class="text-sm text-center text-muted py-2">Loading…</p>
      </div>

      <p v-if="selectedError" class="text-sm text-center text-error py-1">Failed to load selected items</p>
      <p v-else-if="localDisplay.length === 0 && !isFetchingNextPage" class="text-sm text-muted text-center py-4">
        No items selected
      </p>
    </div>
  </UCard>
</template>
