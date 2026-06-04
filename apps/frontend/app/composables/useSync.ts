import { useQueryClient } from '@tanstack/vue-query'

export function useSync() {
  const store = useItemsStore()
  const queryClient = useQueryClient()
  let started = false

  function startPolling() {
    if (started) return
    started = true

    setInterval(async () => {
      await store.flushMutations()
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['selected'] })
    }, 1_000)

    setInterval(async () => {
      await store.flushCreates()
      queryClient.invalidateQueries({ queryKey: ['items'] })
    }, 10_000)
  }

  return { startPolling }
}
