import { defineConfig } from 'orval'

// codegen 설정. 파이프라인·transformer 규칙: packages/api-client/CLAUDE.md
export default defineConfig({
  morton: {
    input: {
      target: './src/openapi.yaml',
      override: {
        transformer: './orval.transformer.ts',
      },
    },
    output: {
      mode: 'single',
      target: './src/generated/api.ts',
      schemas: './src/generated/schemas',
      client: 'react-query',
      mock: { type: 'msw', useExamples: true, baseUrl: '*', locale: 'ko' },
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
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mock: {
          format: {
            'image-url': () => 'https://placehold.co/600x400',
          },
        },
      },
    },
  },
})
