# ADR-0004: API response envelope `{success, data, error}`

- **Status**: Accepted (↓ 2026-05-22 Amendment — `error` 구조 + cross-cutting 에러 선언 정책 변경)
- **Date**: 2026-05-08 (백필 작성일. 결정 자체는 BE 초기 — 정확한 origin 추적 곤란)
- **Deciders**: @fine-pine (BE 초기 도입), @manamana32321 (spec 정렬)
- **Related**: [PR #266](https://github.com/mortonCareer/bconnect/pull/266) (spec 정렬), [`packages/api-client/src/spec/_shared.yaml`](../../../packages/api-client/src/spec/_shared.yaml) (envelope schema)

## Context

API 응답의 success/error 표현을 어떻게 통일할지. FE-BE 양측이 일관된 패턴을 공유하지 않으면:

- FE 에러 핸들링이 endpoint마다 다름 (HTTP status 검사 vs body 필드 vs throw)
- BE의 새 endpoint가 응답 형태 자유 → spec과 drift
- React Query / orval-generated hooks이 응답 wrapping을 일관 처리 못 함

당시(BE 초기) 이미 envelope 패턴이 코드에 존재했으나 spec까지 정렬되지 않아 FE가 추측으로 사용. [PR #266](https://github.com/mortonCareer/bconnect/pull/266)에서 spec까지 정렬.

## Options

### Option 1: REST 표준 (HTTP status + body)

성공: `200 + body T`. 실패: `4xx/5xx + 에러 body`.

- **장점**:
  - HTTP 표준 그대로
  - HTTP 인프라(CDN, monitoring) 친화적
- **단점**:
  - 에러 body 형식이 endpoint마다 다를 위험
  - FE가 status 검사 + body parse 둘 다 분기 필요
  - 비즈니스 에러(검증 실패 등)를 4xx로 표현할지 200+success:false로 표현할지 끝없는 논쟁

### Option 2: [JSON:API](https://jsonapi.org/)

`{ data: ..., errors: [...], meta: {...} }` 표준 형식.

- **장점**: 표준, 풍부한 표현
- **단점**:
  - relations / included / links 등 풍부한 표현이 Morton 규모에 과함
  - spec 작성 부담, FE 매핑 부담

### Option 3: 단순 envelope `{success, data, error}`

```yaml
ApiSuccessResponseBase: { success: true }
ApiErrorResponse: { success: false, error: ApiError, data: null }
ApiError: { code: string, status: string }
```

- **장점**:
  - FE에서 `if (res.success) { res.data } else { res.error }` 단일 패턴
  - HTTP status는 인프라용, biz 의미는 envelope 안에 — 분리 명확
  - orval에서 `customFetch<T>`가 `Promise<ExtractData<T>>` 반환 — FE hooks의 `data`가 inner type 자동 정렬
  - spec 표현 단순 (`allOf: [ApiSuccessResponseBase, { properties: { data: T } }]`)
- **단점**:
  - HTTP 표준에서 약간 일탈 (200으로 에러 응답하는 경우 발생 가능 — 권장은 4xx + envelope 둘 다)
  - 비표준이라 외부 통합 시 설명 필요

### Option 4: GraphQL-like errors[]

`{ data: T, errors: [{ code, message, path }, ...] }` — 부분 성공 표현 가능.

- **장점**: 부분 성공 (한 응답에 여러 entity, 일부만 실패) 표현 가능
- **단점**: REST endpoint는 보통 단일 entity → 부분 성공 표현이 거의 무용

## Decision

**Option 3 (단순 envelope)** 채택.

Spec 정의 ([`_shared.yaml`](../../../packages/api-client/src/spec/_shared.yaml)):

```yaml
ApiSuccessResponseBase:
  type: object
  required: [success]
  properties:
    success: { type: boolean, const: true }

ApiErrorResponse:
  type: object
  required: [success, error, data]
  properties:
    success: { type: boolean, const: false }
    error: { $ref: '#/components/schemas/ApiError' }
    data: { type: [object, 'null'] }

ApiError:
  type: object
  required: [code, status]
  properties:
    code: { type: string, example: 'C001' }
    status: { type: string, example: 'BAD_REQUEST' }
```

각 endpoint의 200 응답은 `allOf: [ApiSuccessResponseBase, { properties: { data: <도메인 타입> } }]`로 wrap.

근거:

- Morton 규모에서 단순함 > 표준 적합성
- FE 에러 핸들링 일관 패턴 강제
- orval codegen + React Query 통합이 envelope 패턴에 자연스러움
- HTTP status는 인프라(CDN cache, monitoring) 용도로 유지하되 비즈니스 의미는 envelope에서 결정

## Consequences

- **좋은 결과**:
  - FE 에러 처리 단일 패턴 (`if (!res.success) handleError(res.error)`)
  - `customFetch<T>`가 `ExtractData<T>` 자동 unwrap → orval hook의 `data`가 inner type
  - BE 새 endpoint가 envelope 누락 시 spec lint 실패 — drift 자동 차단
- **나쁜 결과**:
  - HTTP 표준에서 약간 일탈 — 외부 API 통합 또는 외부 계약 시 설명 비용
  - void 응답(PUT/DELETE 일부) wrap 안 함 → ExtractData fallback 처리 필요 — codegen 복잡도 약간 ↑
- **중립적 결과**:
  - `ApiError`는 의도적으로 simple (`{code, status}` 만). 사람용 message는 클라이언트가 code → message 매핑. 다국어/A11y 대응 단일 책임. _(↓ 2026-05-22 Amendment A 로 번복 — message BE 소유, `status` 제거.)_

## Notes

- envelope 도입 origin은 BE 초기. spec 정렬은 [PR #266](https://github.com/mortonCareer/bconnect/pull/266) Phase 1
- 루트 [`CLAUDE.md`](../../../CLAUDE.md)에 "API Response Wrapper" 패턴 명시
- 후속: void 응답 unwrap 패턴 검증 — orval generated hooks의 `data` 타입이 정확히 `void`로 떨어지는지 spot check 필요

## Amendment 2026-05-22 — 에러 envelope 정비

> 2026-05-22 회의 의결. envelope 결정(Option 3)은 유지, `error` 구조·에러 선언 방식만 변경. 위 본문은 역사 보존용. **Related**: [#398](https://github.com/mortonCareer/bconnect/issues/398), [#270](https://github.com/mortonCareer/bconnect/issues/270)

### A. `error` 구조 — `{code, status}` → `{code, message}`

- `error.status` 제거 — HTTP status line과 중복, FE 소비처 0.
- `error.message` 추가 — **BE 정의, FE 그대로 표시.** `error.code`는 분기 키로 유지.
- **⚠️ 위 Consequences "message는 클라가 code→message 매핑"을 번복** — 소유권 클라 → BE. 근거: BE `ExceptionCode`가 한국어 카피를 이미 보유(`@JsonIgnore`로 막혀 있었을 뿐) → 클라 매핑은 카피 2벌 = SSOT 붕괴. 단일 언어라 i18n 명분도 부재.
- BE: `ExceptionCode.getMessage()` `@JsonIgnore` 제거 / `getStatus()` `@JsonIgnore` 추가(메서드 유지) / `getLogLevel()` 유지.
- 스펙: [`_shared.yaml`](../../../packages/api-client/src/spec/_shared.yaml) `ApiError` → `{code, message}`, `code`는 신규 `ApiErrorCode` 카탈로그 enum 참조.

### B. cross-cutting 에러 응답 선언 정책

에러를 **처리 주체** 기준 두 부류로 나눠 선언 방식을 달리한다.

| 부류                                                                             | per-op 선언                                                      |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Cross-cutting 인프라 (`401`·`500` — `customFetch`가 처리)                        | 안 함, 본 정책으로 1회 명시                                      |
| Feature 에러 (`400`/`403`/`404`/`409`·도메인 코드 — feature가 `error.code` 분기) | 함 ([#270](https://github.com/mortonCareer/bconnect/issues/270)) |

근거: `401`은 `client.ts`가 가로채 처리 → feature 코드가 분기 안 함. per-op 선언은 가치가 없고 [#270](https://github.com/mortonCareer/bconnect/issues/270)의 보일러플레이트만 44배로 키운다. [`api-client/CLAUDE.md`](../../../packages/api-client/CLAUDE.md) 템플릿의 `'401'` 블록 제거로 정합.
