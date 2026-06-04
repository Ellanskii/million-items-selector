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

      <footer class="text-center text-sm text-muted pt-2">
        <a
          href="https://github.com/Ellanskii/million-items-selector"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 hover:text-highlighted transition-colors"
        >
          <UIcon name="i-simple-icons-github" class="size-4" />
          Ellanskii
        </a>
      </footer>

    </div>
  </div>
</template>
