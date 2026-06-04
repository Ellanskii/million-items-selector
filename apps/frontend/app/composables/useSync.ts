export function useSync() {
  const store = useItemsStore()
  let started = false

  function startPolling() {
    if (started) return
    started = true

    // Mutations flush every 1s — queries poll themselves via refetchInterval
    setInterval(() => store.flushMutations(), 1_000)
    setInterval(() => store.flushCreates(), 10_000)
  }

  return { startPolling }
}
