import { useQueryClient } from '@tanstack/vue-query'

export function useSync() {
  const store = useItemsStore()
  const queryClient = useQueryClient()
  const toast = useToast()
  let started = false

  function startPolling() {
    if (started) return
    started = true

    setInterval(async () => {
      const had = store.hasPending()
      try {
        await store.flushMutations()
        if (had) {
          queryClient.invalidateQueries({ queryKey: ['items'] })
          queryClient.invalidateQueries({ queryKey: ['selected'] })
        }
      } catch {
        toast.add({ title: 'Sync error', description: 'Failed to save changes, retrying…', color: 'error' })
      }
    }, 1_000)

    setInterval(async () => {
      const had = store.hasPendingCreates()
      try {
        await store.flushCreates()
        if (had) queryClient.invalidateQueries({ queryKey: ['items'] })
      } catch {
        toast.add({ title: 'Sync error', description: 'Failed to create items, retrying…', color: 'error' })
      }
    }, 10_000)
  }

  return { startPolling }
}
