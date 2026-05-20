import { defineConfig } from 'orval'

// orval — OpenAPI spec 으로부터 다음을 자동 생성:
// 1. TypeScript types (schemas)
// 2. React Query hooks (useGetUser, useUpdateProfileMutation 등)
// 3. MSW mock handlers (`mock` 옵션 활성 시)
//
// MSW mock generation 흐름:
//   spec 의 각 operation → `getXxxMockHandler()` 함수
//   spec 의 각 schema → `getXxxResponseMock()` 함수 (faker 로 random 데이터)
//     - `example: ...` 명시된 필드 → 그 값 사용
//     - `const: <v>` → 그 리터럴 강제
//     - `format: date-time/email/uri` 등 → 적절한 faker 호출
//     - 그 외 → 타입 기반 random (string/number/boolean/array)
//   모든 handler 를 `getBconnectAPIMock()` aggregator 에 모아 export
//
// 결과: MSW provider 가 `getBconnectAPIMock()` 을 setupWorker 에 넘기면
// 모든 endpoint 가 spec 기반 mock 응답으로 대체됨. stateful flow 가 필요한
// endpoint (auth OTP 검증 등) 는 별도 패키지 (@bconnect/mocks/overrides) 에서 override.
export default defineConfig({
  morton: {
    input: {
      target: './src/openapi.bundled.yaml',
      override: {
        // compile-time: spec 의 envelope 을 type 단계에서 strip → generated type
        // 이 inner data 만 expose. 런타임 unwrap 은 customFetch 가 담당.
        transformer: './orval.transformer.ts',
      },
    },
    output: {
      mode: 'single',
      target: './src/generated/api.ts',
      schemas: './src/generated/schemas',
      client: 'react-query',
      // MSW handlers + faker 기반 mock 데이터 생성. baseUrl '*' 는 모든 origin 매칭
      // (FE 가 절대 URL 을 사용해도 가로챌 수 있게). locale 'ko' 는 faker 의 한국어 로케일.
      // packages/mocks/ 에서 stateful override 와 합쳐 사용.
      mock: { type: 'msw', useExamples: true, baseUrl: '*', locale: 'ko' },
      override: {
        // 모든 hook 의 fetch 호출을 src/client.ts 의 customFetch 로 위임.
        // customFetch 가 envelope unwrap + 401 자동 retry + ApiError 변환 처리.
        mutator: {
          path: './src/client.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useSuspenseQuery: true,
        },
        // orval 8 의 generated 함수 return type 을 `Promise<{ data, status }>` →
        // `Promise<T>` 로 simplified. wrapper 가 hook 까지 노출되는 것 방지.
        // mutator 가 inner data 를 return 하면 hook 의 `data` 도 raw payload.
        fetch: {
          includeHttpResponseReturnType: false,
        },
        // mock format override:
        //   spec 의 `format: image-url` 필드 (Member.picture, Post.images 등) 가
        //   `useExamples: true` 만으로는 nullable union/array items 의 `example` 을
        //   못 받아오는 orval 한계 우회 → placeholder URL 강제로 콘솔 noise 제거
        //   + 실제 이미지 렌더링.
        //
        //   `image-url` 은 [JSON Schema 의 custom format](https://json-schema.org/draft/2020-12/json-schema-validation#name-custom-format-attributes)
        //   허용 규정에 따른 vendor format. 표준 `format: uri` (webhook URL,
        //   redirect URI 등 모든 URI) 와 의미 분리 — 비-이미지 URI 가 추가돼도
        //   default faker 로 fallback (이 override 미적용).
        mock: {
          format: {
            'image-url': () => 'https://placehold.co/600x400',
          },
        },
      },
    },
  },
})
