<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { api } from '@million-items-selector/api-client'

const LIMIT = 20
const ROW_HEIGHT = 44

const store = useItemsStore()
const { startPolling } = useSync()
const toast = useToast()

const leftFilter = ref('')
const rightFilter = ref('')
const newItemId = ref<number | null>(null)

// ---- Left panel: unselected items ----

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

const leftParent = ref<HTMLElement | null>(null)

const leftVirtualizer = useVirtualizer(computed(() => ({
  count: allItems.value.length,
  getScrollElement: () => leftParent.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
})))

watchEffect(() => {
  const rows = leftVirtualizer.value.getVirtualItems()
  const last = rows[rows.length - 1]
  if (!last) return
  if (last.index >= allItems.value.length - 1 && hasMoreItems.value && !loadingMoreItems.value)
    fetchMoreItems()
})

// ---- Right panel: selected items ----

const {
  data: selectedData,
  fetchNextPage: fetchMoreSelected,
  hasNextPage: hasMoreSelected,
  isFetchingNextPage: loadingMoreSelected,
} = useInfiniteQuery({
  queryKey: computed(() => ['selected', rightFilter.value]),
  queryFn: ({ pageParam }) =>
    api.GET('/selected', {
      params: { query: { page: pageParam as number, limit: LIMIT, filter: rightFilter.value || undefined } },
    }).then(r => r.data!),
  initialPageParam: 1,
  getNextPageParam: (last) => last.page * LIMIT < last.total ? last.page + 1 : undefined,
  maxPages: 3,
  refetchInterval: 1_000,
})

const allSelected = computed(() => selectedData.value?.pages.flatMap(p => p.items) ?? [])

const rightParent = ref<HTMLElement | null>(null)

const rightVirtualizer = useVirtualizer(computed(() => ({
  count: allSelected.value.length,
  getScrollElement: () => rightParent.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
})))

watchEffect(() => {
  const rows = rightVirtualizer.value.getVirtualItems()
  const last = rows[rows.length - 1]
  if (!last) return
  if (last.index >= allSelected.value.length - 1 && hasMoreSelected.value && !loadingMoreSelected.value)
    fetchMoreSelected()
})

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
              <div
                :style="{ height: `${leftVirtualizer.getTotalSize()}px`, position: 'relative' }"
              >
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
                  <span class="tabular-nums">{{ allItems[row.index]?.id }}</span>
                  <UButton
                    size="xs"
                    variant="subtle"
                    @click="store.select(allItems[row.index]!.id)"
                  >
                    Select
                  </UButton>
                </div>
              </div>
            </div>

            <p v-if="loadingMoreItems" class="text-sm text-center text-muted py-1">
              Loading…
            </p>
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

        <!-- Right panel: selected items -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Selected</span>
              <UBadge color="success" variant="subtle">{{ allSelected.length }} loaded</UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <UInput
              v-model="rightFilter"
              placeholder="Filter by id…"
              leading-icon="i-lucide-search"
            />

            <div ref="rightParent" class="overflow-y-auto h-[500px]">
              <div
                :style="{ height: `${rightVirtualizer.getTotalSize()}px`, position: 'relative' }"
              >
                <div
                  v-for="row in rightVirtualizer.getVirtualItems()"
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
                  <span class="tabular-nums">{{ allSelected[row.index]?.id }}</span>
                  <UButton
                    size="xs"
                    variant="subtle"
                    color="error"
                    @click="store.unselect(allSelected[row.index]!.id)"
                  >
                    Remove
                  </UButton>
                </div>
              </div>
            </div>

            <p v-if="loadingMoreSelected" class="text-sm text-center text-muted py-1">
              Loading…
            </p>
            <p v-else-if="allSelected.length === 0" class="text-sm text-muted text-center py-4">
              No items selected
            </p>
          </div>
        </UCard>

      </div>
    </div>
  </div>
</template>
