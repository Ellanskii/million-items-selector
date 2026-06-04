export default defineNuxtConfig({
  ssr: false,
  future: { compatibilityVersion: 4 },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
  compatibilityDate: '2026-06-04',
})
