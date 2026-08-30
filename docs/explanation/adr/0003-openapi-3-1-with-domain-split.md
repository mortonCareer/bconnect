# ADR-0003: OpenAPI 3.1 + 도메인 분리 (packing) + envelope wrap

- 상태: [ADR-0024](0024-orval-consumes-be-springdoc-spec.md) 로 대체됨. 손-작성 `src/spec/` 폐기, orval 이 BE springdoc spec 직접 소비
- 날짜: 2026-05-02 ([PR #266](https://github.com/mortonCareer/bconnect/pull/266) 머지)
- 담당자: @manamana32321 @fine-pine

## 개요

MSW migration [PR #247](https://github.com/mortonCareer/bconnect/pull/247) 코드 리뷰 중 envelope 정렬 문제 [#252](https://github.com/mortonCareer/bconnect/issues/252) 발견. 이를 출발점으로 spec 전반의 구조적 부채를 인지:

1. monolithic spec: 1,700줄 단일 `openapi.yaml`. 도메인 추가/수정 시 충돌 잦음, 가독성 ↓
2. `allOf` 가독성: envelope wrap을 `allOf`로 표현하려는데 monolithic 안에서는 nested 깊이 통제 어려움
3. OpenAPI 3.0 한계: nullable 표현, JSON Schema 호환, webhook 등. 3.1에서 정리됨
4. FE-BE 정합 깨짐: spec과 BE/FE 코드 사이 drift 누적

## 선택지

### 옵션 1: monolithic 유지 + 부분 수정만

`openapi.yaml` 한 파일 그대로 유지, envelope 문제만 임시 패치.

장점

- 변경 최소

단점

- 부채 누적, 다음 도메인 추가 시 또 같은 문제, FE-BE drift 방치

### 옵션 2: 완전 split (file per resource)

[Redocly : split](https://redocly.com/docs/cli/commands/split) 결과. 1 root + 45 paths + 50 schemas = 96 파일.

장점

- 단일 책임 극대, conflict 0

단점

- 96 파일 navigation 부담
- 한 도메인 작업 시 5-10 파일 동시 편집
- import/export 그래프 복잡

### 옵션 3: 도메인 packing (14 파일)

도메인별로 paths + schemas + securitySchemes를 한 파일에 묶음. cross-cutting(envelope, Address)만 `_shared.yaml`로 분리.

장점

- 한 도메인 작업 = 한 파일 편집
- 도메인별 ownership 명확 (auth, members, chats, ...)
- `_shared.yaml`이 진정 공유되는 항목만 보유. semantic clarity

단점

- 한 도메인 파일이 커질 수 있음. 현 최대는 profiles 299줄. 통념 안.

### 옵션 4: OpenAPI 3.0 유지 vs 3.1 업그레이드

3.1은 [JSON Schema](https://json-schema.org/) 호환. nullable, examples, webhooks 등 표현력 ↑. 하위 호환 깨지는 부분 있음. e.g., `nullable: true` → `type: ['string', 'null']`.

- 3.1 업그레이드: 표현력 ↑, 향후 부채 ↓
- 3.0 유지: 기존 코드 영향 0

## 결정사항

옵션 3 (도메인 packing 14 파일) + 옵션 4 (3.1 업그레이드) + envelope wrap 통합 채택.

결과 구조:

```text
packages/api-client/src/spec/
├── openapi.yaml          # 진입점 (info, tags, paths 매핑)
├── _shared.yaml          # cross-cutting: HTTP envelope (ApiError, ApiErrorResponse,
│                         #                ApiSuccessResponseBase) + cross-domain (Address)
└── v1/
    ├── auth.yaml         # paths + securitySchemes + JwtPayload + 도메인 schemas
    ├── members.yaml
    ├── chats.yaml
    ├── credentials.yaml
    ├── coworkers.yaml
    ├── coworker-requests.yaml
    ├── recommendations.yaml
    ├── posts.yaml
    ├── tasks.yaml
    ├── profiles.yaml
    ├── feeds.yaml
    └── devices.yaml
```

총 14 파일. full split 96 파일 대비 85% 감소. 도메인 평균 188줄, 최대 299줄.

Bundle 파이프라인: [Redocly : CLI](https://redocly.com/docs/cli/) `split` + `bundle`. CI `ci-api-spec` job이 lint + bundle.

근거:

- 도메인 packing이 monolithic의 conflict 문제와 full split의 navigation 부담 사이 sweet spot
- 3.1 업그레이드를 envelope/도메인 분리와 함께 한 PR로 묶음. 어차피 spec 전체 회귀 검증 필요했으므로 추가 비용 작음
- envelope wrap (`allOf: [ApiSuccessResponseBase, { properties: { data } }]`)이 도메인 packing 안에서 자연스럽게 표현됨

## 기대 효과

- 좋은 결과:
  - 도메인별 작업 = 1 파일. conflict ↓, 리뷰 인지부하 ↓
  - `_shared.yaml`이 진정 공유 항목만 보유 → 새 도메인이 envelope 모르고 직접 정의하는 실수 ↓
  - 3.1 표현력으로 nullable/examples 정확히. FE 타입 정확도 ↑
  - bundle 결과 byte-identical 검증으로 회귀 zero 확인됨
- 나쁜 결과:
  - 새 spec 변경 시 `pnpm api:bundle` 실행 필수. 잊으면 FE 빌드 깨짐, CI 잡음
  - bundle 파이프라인 추가 의존성 (`@redocly/cli`)
- 중립적 결과:
  - PR 본문에 "시스템 동작 차원 변경 zero — BE/FE 코드 영향 없음" 명시. 의미 변경 검증 섹션이 회귀 차단의 근거.
  - [PR #281](https://github.com/mortonCareer/bconnect/pull/281)에서 후속 typecheck drift 일괄 해소.

## 메모

- ADR-0004 (envelope `{success, data, error}`)와 같은 PR에서 정렬됐으나 envelope 패턴 자체는 이전부터 BE 코드에 있던 결정. ADR-0004로 별도 기록
- 14 commits로 분할되어 phase별 검증 가능. Phase 1 envelope wrap, Phase 2 도메인 분리 + bundle, ...
- spec 변경 워크플로: [development.md](../../how-to/development.md) 참조

## 참조

- [#265](https://github.com/mortonCareer/bconnect/issues/265) : 메타
- [#263](https://github.com/mortonCareer/bconnect/issues/263) : 도메인 분리
- [#264](https://github.com/mortonCareer/bconnect/issues/264) : 3.1 업그레이드
- [PR #266](https://github.com/mortonCareer/bconnect/pull/266)
