import { defineConfig } from 'orval'

export default defineConfig({
  morton: {
    input: {
      target: './src/openapi.bundled.yaml',
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
        // ApiSuccessResponseBase.success 가 mock 에서 random faker boolean 으로
        // 생성되는 걸 방지. BE ApiResponse.success(...) 와 정렬되도록 강제.
        // (orval 이 enum: [true] 를 mock generator 에서 honor 하지 못함)
        mock: {
          properties: {
            '/^success$/': true,
          },
        },
      },
    },
  },
})
