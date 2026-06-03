import createClient from 'openapi-fetch'
import type { paths } from './generated/schema.js'

export type { components, paths } from './generated/schema.js'

export const api = createClient<paths>({
  baseUrl: typeof process !== 'undefined'
    ? (process.env.API_BASE_URL ?? 'http://localhost:3001')
    : 'http://localhost:3001',
})
