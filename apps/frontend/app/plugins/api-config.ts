import { configureApiBaseUrl } from '@million-items-selector/api-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  configureApiBaseUrl(config.public.apiBase as string)
})
