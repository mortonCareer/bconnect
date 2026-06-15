import { defineConfig } from 'orval'

// BE-springdoc 배선 PoC config (손-spec 폐기 검증용).
//
// orval.config.ts 와 차이: input = BE springdoc 산출 spec(sanitized),
// transformer = becompat (enum hoist + schema rename + opId 규칙 + envelope unwrap).
// output 타겟은 동일 → career/plan 이 그대로 typecheck 하면 호환성이 빨강/초록으로 드러남.
//
// 실행: pnpm --filter @bconnect/api-client exec orval --config orval.config.becompat.ts
// 복원: pnpm api:generate
export default defineConfig({
  morton: {
    input: {
      // api-docs.fresh.yaml = 로컬 gradle generateOpenApiDocs 산출(현재 BE).
      // enumsAsRef=true 라 enum named, illegal key 없음 → sanitize 불필요.
      target: '../../api-docs.fresh.yaml',
      override: {
        transformer: './orval.transformer.becompat.ts',
      },
    },
    output: {
      mode: 'single',
      target: './src/generated/api.ts',
      schemas: './src/generated/schemas',
      client: 'react-query',
      mock: { type: 'msw', useExamples: true, baseUrl: '*', locale: 'ko' },
      override: {
        mutator: { path: './src/client.ts', name: 'customFetch' },
        query: { useQuery: true, useMutation: true, useSuspenseQuery: true },
        fetch: { includeHttpResponseReturnType: false },
        mock: { format: { 'image-url': () => 'https://placehold.co/600x400' } },
      },
    },
  },
})
