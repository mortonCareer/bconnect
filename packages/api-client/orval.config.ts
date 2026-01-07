import { defineConfig } from 'orval'

export default defineConfig({
  morton: {
    input: {
      target: './src/openapi.yaml',
    },
    output: {
      mode: 'single',
      target: './src/generated/api.ts',
      schemas: './src/generated/schemas',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/client.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useSuspenseQuery: true,
        },
      },
    },
  },
})
