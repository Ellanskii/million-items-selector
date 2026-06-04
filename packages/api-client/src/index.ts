import createClient from 'openapi-fetch'
import type { paths } from './generated/schema.js'

export type { components, paths } from './generated/schema.js'

let client = createClient<paths>({ baseUrl: 'http://localhost:3001' })

// Proxy forwards every call to the current client instance.
// Call configureApiBaseUrl() once at app startup to point at the real API.
export const api = new Proxy<typeof client>({} as typeof client, {
  get: (_, prop) => (client as any)[prop],
})

export function configureApiBaseUrl(baseUrl: string) {
  client = createClient<paths>({ baseUrl })
}
