# ADR-0005: orval 8 마이그레이션

- 상태: 승인됨
- 날짜: 2026-05-09
- 담당자: @manamana32321

## 개요

[ADR-0004](./0004-api-response-envelope.md) 에서 모든 API 응답을 `{success, data, error}` envelope 으로 묶기로 결정. [PR #294](https://github.com/mortonCareer/bconnect/pull/294) 작업 중 orval 7 의 generated mock 한계 발견. `useExamples: true` 가 nullable union (`type: ['string', 'null']`) 과 array `items` 의 `example` 을 mock generator 로 전달 못 하는 문제.

근본 fix 는 orval 8.8.0+ 의 mock fix 들 ([orval-labs/orval#3081](https://github.com/orval-labs/orval/issues/3081), [orval-labs/orval#3271](https://github.com/orval-labs/orval/pull/3271), [orval-labs/orval#2896](https://github.com/orval-labs/orval/pull/2896)) 에 포함됨. 단 orval 7→8 major bump 시 두 종류 drift 발생. 이전 worktree 측정 기준:

1. mutator 시그니처 변경 (60+ 위치): `customFetch(config, opts)` → `customFetch(url, opts)`
2. hook return wrapper 노출 (200+ 위치): `useGetMember().data` 의 type 이 `Member` → `{ data: Member; status: number }`

총 typecheck 316 errors (career 200 + plan 116). day-scale refactor 우려.

## 선택지

### 옵션 1: Case 1, transformer + `includeHttpResponseReturnType: false`

orval 의 `input.override.transformer` 로 spec 의 envelope (`allOf: [ApiSuccessResponseBase, {data: T}]`) 을 spec 단계에서 unwrap. 동시에 `includeHttpResponseReturnType: false` 로 generated 함수의 HTTP status wrapper 끄기. customFetch 도 raw `T` return.

장점

- 사용처 hook 사용 코드 0개 수정. orval 7 패턴 그대로
- transport detail 인 envelope, status 를 customFetch 한 곳에 격리
- 새 hook 추가 시에도 boilerplate 0
- 측정: 316 → 84 → 3 → 0 errors

단점

- transformer 작성 70줄, one-time
- status code / headers 가 hook 까지 노출 안 됨. 미래 활용 시 escape hatch 필요

### 옵션 2: Case 4, wrapper 노출 그대로

orval 8 default 동작 유지. hook 의 `data` 가 `{ data: T; status: number }` wrapper. envelope (`{success, data}`) 도 type 에 노출.

장점

- HTTP status, envelope 의 `success`, `error` 메타가 hook 사용처에 직접 접근 가능. future-proofing
- transformer 작성 X

단점

- 약 20개 파일의 hook 사용처 84개 수정 필요 (`.data.foo` → `.data.data.foo` 또는 `.data.data.data.foo`)
- 새 hook 추가 시마다 동일 boilerplate 반복
- transport detail 이 domain 코드인 컴포넌트까지 침범. layer separation 깨짐
- 사용 검증: `grep` 결과 status / headers / envelope `success` 활용 사례 0건. 작성 시점 기준

### 옵션 3: codemod 자동화 + wrapper 노출

옵션 2 의 84개 fix 를 jscodeshift / ts-morph 로 자동화.

장점

- 일회성 자동 변환

단점

- codemod 작성 비용 발생. 미래 hook 추가 시 boilerplate 그대로. 자동화는 1회용

### 옵션 4: 별도 mock layer (json-schema-faker 등)

orval mock 끄고 별도 fixture builder 도입.

장점

- 외부 도구 json-schema-faker 의 `useExamplesValue:true` 가 nullable example 처리

단점

- stack 변경량 큼. orval 의 type-driven gate 인 spec drift 자동 검출 일부 손실. 단순 bump 는 1줄 옵션 `override.mock.format` 으로 [PR #296](https://github.com/mortonCareer/bconnect/pull/296) 에서 이미 우회. 추가 도입 가치 미미

## 결정사항

옵션 1 채택. transformer + wrapper 끄기.

근거:

1. 사용 검증: `grep` 으로 status / headers / envelope `success` 활용 0건. "미래 가설" 을 위해 모든 사용처에 즉각 boilerplate 부과는 over-engineering. YAGNI.
2. layer separation 보존: customFetch 가 transport 를 단일 격리. transport 는 envelope unwrap, 401 retry, ApiError 변환. transformer 가 그것의 type-side 짝. domain 코드는 raw payload 만 봄. ADR-0004 의 envelope 결정 정신 "transport contract" 과 정렬.
3. escape hatch 가능: 미래 status / headers 가 진짜 필요해지면 한 endpoint 단위 도입 가능. 방법은 (a) `customFetch` variant, (b) react-query `meta` 옵션, (c) `ApiError.status` 추가, (d) 그 endpoint 만 `override.operations.<id>.mutator` 로 다른 mutator 지정. 전역 wrapper 노출 없이 한정적 활용.
4. migration cost: 측정 데이터는 transformer 70줄 vs 84개 사용처 수정 + 미래 모든 hook 의 `.data.data` 보일러. ROI 압도적.

## 기대 효과

### 좋은 결과

- 사용처 코드 변경 0. `orval 7 패턴 (member?.id)` 유지
- 새 hook 추가 시 자동으로 raw payload 노출. 결정의 미래 적용 비용 0
- orval 8 의 mock fix 들 자동 적용 + Zod nullable/$ref 지원 향상 + axios 제거 부수 이점. default httpClient 가 fetch
- type 단계 transformer 와 runtime 단계 customFetch 의 정렬이 codegen 으로 강제되어 silent drift 방지

### 나쁜 결과

- transformer 가 spec 패턴 `allOf: [base, {data: T}]` 가정에 의존. 미래 BE 가 다른 응답 패턴 도입 시 transformer 수정 필요. 예 `data` 외 필드 추가
- HTTP status / `Set-Cookie` 같은 transport 메타가 hook 까지 자동 노출 안 됨. 진짜 필요한 endpoint 발견 시 escape hatch 패턴 도입 부담 발생, one-time

### 중립적 결과

- mock stateful overrides `packages/mocks/src/overrides/` 의 callback 들이 inner data 만 return 하도록 정렬됨. orval 7 시절의 envelope return 보다 일관성 ↑

## 메모

- 측정 단계별 typecheck errors:

  | 단계                                                          | errors                      |
  | ------------------------------------------------------------- | --------------------------- |
  | orval 8 plain bump                                            | 316 (career 200 + plan 116) |
  | + customFetch 재작성 + `includeHttpResponseReturnType: false` | 84                          |
  | + transformer                                                 | 3 (mock overrides)          |
  | + mock overrides envelope unwrap                              | 0                           |

- 미래 escape hatch 필요 시점에 별도 ADR 작성 권장. "ADR-X: customFetch variant for status-aware endpoints" 같은 형태
- [PR #296](https://github.com/mortonCareer/bconnect/pull/296) 의 `override.mock.format.image-url` 은 orval 8 + transformer 후에도 그대로 작동. forward-compatible
- 관련 코드: [packages/api-client/orval.transformer.ts](../../../packages/api-client/orval.transformer.ts), [packages/api-client/src/client.ts](../../../packages/api-client/src/client.ts), [packages/api-client/orval.config.ts](../../../packages/api-client/orval.config.ts)

## 참조

- [#297](https://github.com/mortonCareer/bconnect/issues/297)
- [PR #300](https://github.com/mortonCareer/bconnect/pull/300)
- [ADR-0004](./0004-api-response-envelope.md)
