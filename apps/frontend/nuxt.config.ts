export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
})
