import { useQueryClient } from '@tanstack/vue-query'

export function useSync() {
  const store = useItemsStore()
  const queryClient = useQueryClient()
  let started = false

  function startPolling() {
    if (started) return
    started = true

    // Flush mutations every 1s; invalidate only when something actually changed
    setInterval(async () => {
      const had = store.hasPending()
      await store.flushMutations()
      if (had) {
        queryClient.invalidateQueries({ queryKey: ['items'] })
        queryClient.invalidateQueries({ queryKey: ['selected'] })
      }
    }, 1_000)

    // Flush creates every 10s; invalidate items if anything was added
    setInterval(async () => {
      const had = store.hasPendingCreates()
      await store.flushCreates()
      if (had) queryClient.invalidateQueries({ queryKey: ['items'] })
    }, 10_000)
  }

  return { startPolling }
}
