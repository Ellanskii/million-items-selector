<script setup lang="ts">
const { startPolling } = useSync()
onMounted(() => startPolling())
</script>

<template>
  <div class="min-h-screen bg-default p-6">
    <div class="max-w-6xl mx-auto space-y-4">

      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-bold">Million Items Selector</h1>
        <AppInfoModal />
      </div>

      <div class="grid grid-cols-2 gap-6">
        <ItemsPanel />
        <SelectedPanel />
      </div>

    </div>
  </div>
</template>
