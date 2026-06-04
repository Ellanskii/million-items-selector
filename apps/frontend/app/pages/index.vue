<script setup lang="ts">
const store = useItemsStore()
const toast = useToast()

const newItemId = ref<number | null>(null)
const creating = ref(false)

onMounted(() => store.refresh())

async function handleCreate() {
  if (!newItemId.value) return
  creating.value = true
  const err = await store.createItem(newItemId.value)
  creating.value = false
  if (err) {
    toast.add({ title: 'Error', description: err, color: 'error' })
  } else {
    toast.add({ title: `Item ${newItemId.value} added`, color: 'success' })
    newItemId.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--ui-bg) p-6">
    <div class="max-w-6xl mx-auto space-y-4">

      <h1 class="text-2xl font-bold">Million Items Selector</h1>

      <div class="grid grid-cols-2 gap-6">

        <!-- Left panel: all unselected items -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Items</span>
              <UBadge variant="subtle">{{ store.totalUnselected }} unselected</UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <UInput
              v-model="store.filter"
              placeholder="Filter by id…"
              leading-icon="i-lucide-search"
            />

            <ul class="divide-y divide-(--ui-border)">
              <li
                v-for="item in store.items"
                :key="item.id"
                class="flex items-center justify-between py-2"
              >
                <span class="tabular-nums">{{ item.id }}</span>
                <UButton size="xs" variant="subtle" @click="store.select(item.id)">
                  Select
                </UButton>
              </li>
            </ul>

            <div class="flex items-center justify-between pt-1">
              <UButton
                size="xs"
                variant="ghost"
                leading-icon="i-lucide-chevron-left"
                :disabled="store.page <= 1"
                @click="store.prevPage()"
              />
              <span class="text-sm text-(--ui-text-muted)">
                Page {{ store.page }} / {{ store.totalPages }}
              </span>
              <UButton
                size="xs"
                variant="ghost"
                leading-icon="i-lucide-chevron-right"
                :disabled="store.page >= store.totalPages"
                @click="store.nextPage()"
              />
            </div>
          </div>

          <template #footer>
            <form class="flex gap-2" @submit.prevent="handleCreate">
              <UInput
                v-model.number="newItemId"
                type="number"
                placeholder="Custom item id"
                class="flex-1"
              />
              <UButton type="submit" :loading="creating" leading-icon="i-lucide-plus">
                Add
              </UButton>
            </form>
          </template>
        </UCard>

        <!-- Right panel: selected items -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Selected</span>
              <UBadge color="success" variant="subtle">{{ store.selected.length }}</UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <UInput
              v-model="store.selectedFilter"
              placeholder="Filter by id…"
              leading-icon="i-lucide-search"
            />

            <ul class="divide-y divide-(--ui-border)">
              <li
                v-for="item in store.selected"
                :key="item.id"
                class="flex items-center justify-between py-2"
              >
                <span class="tabular-nums">{{ item.id }}</span>
                <UButton
                  size="xs"
                  variant="subtle"
                  color="error"
                  @click="store.unselect(item.id)"
                >
                  Remove
                </UButton>
              </li>
            </ul>

            <p v-if="store.selected.length === 0" class="text-sm text-(--ui-text-muted) text-center py-4">
              No items selected
            </p>
          </div>
        </UCard>

      </div>
    </div>
  </div>
</template>
