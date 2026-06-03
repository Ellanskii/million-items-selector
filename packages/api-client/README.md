# @million-items-selector/api-client

Typed HTTP client generated from the OpenAPI spec in `packages/contracts`.

## Usage

```ts
import { api } from '@million-items-selector/api-client'

const { data, error } = await api.GET('/items', {
  params: { query: { page: 1, limit: 20, filter: '42' } },
})

await api.POST('/select', {
  body: { ids: [1, 2, 3] },
})
```

All request/response types are inferred automatically — no manual type annotations needed.

## Regenerating

Run from the monorepo root after changing `packages/contracts/openapi.yaml`:

```sh
pnpm generate:api
```

Do not edit `src/generated/schema.ts` by hand.

## Configuration

The base URL is read from the `API_BASE_URL` environment variable, falling back to `http://localhost:3001`.

In Nuxt, set it via `NUXT_API_BASE_URL` and pass it through a composable wrapper.
