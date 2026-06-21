# ADR-0010: dev 브랜치 데이터 소스 — MSW mock → 실 staging BE

- **Status**: Proposed
- **Date**: 2026-05-14
- **Deciders**: @manamana32321, @fine-pine (리뷰)
- **Related**: [ADR-0006](./0006-dev-as-staging.md) (amends), [ADR-0005](./0005-orval-mock-transformer-and-no-response-wrapper.md), [ADR-0009](./0009-be-db-hosting-railway-staging.md) (자매 결정 — staging 환경 제공), [#339](https://github.com/mortonCareer/bconnect/issues/339)

## Context

[ADR-0006](./0006-dev-as-staging.md) 은 dev 브랜치 = mock 기반 staging 을 정착시켰다 — BE 미완성 단계에서 FE 단독 dogfood 를 위해 dev 배포 환경이 MSW 로 동작한다.

ADR-0006 은 이 변경을 **escape hatch 로 미리 설계**해뒀다:

> 미래 dev 가 staging 로 부족하다면 (예: BE 도 dev 환경 필요): `vercel_custom_environment` 에 별도 env 변수 분리 — dev-only `NEXT_PUBLIC_API_URL` 로 staging BE 호출

두 가지가 이 hatch 의 발동 시점을 만들었다:

1. [ADR-0009](./0009-be-db-hosting-railway-staging.md) 이 BE + DB staging 환경을 Railway 에 추가 → dev 가 가리킬 **실 BE 가 존재**하게 됨.
2. ADR-0006 이 기록한 silent-failure 사고들(orval transformer 부작용으로 MSW wire format 이 envelope 없이 변경 → customFetch silent reject)은 **mock 레이어 자체가 desync 위험원**임을 보여준다. dev 가 실 BE 를 보면 이 divergence 가 dev 단계에서 노출된다.

따라서 dev 브랜치의 데이터 소스를 재결정한다.

## Options

### Option 1: dev 그대로 MSW mock 유지 (ADR-0006 현행)

- **장점**: 변경 0. dev dogfood 가 BE 가용성에 의존하지 않는다.
- **단점**: ADR-0006 silent-failure 의 desync 위험원 잔존. BE 통합 문제를 dev 에서 영영 못 본다 — main 머지 후에야 실 BE 노출 (ADR-0006 이 "dev→main PR 이 사실상 BE 준비 확인" 이라 인정한 그 갭).

### Option 2: dev 브랜치 환경만 실 staging BE, feature PR·로컬·테스트는 MSW 유지

- dev 브랜치 배포 환경: MSW 비활성 → Railway staging BE 호출
- feature PR preview: MSW 유지 — feature 브랜치는 staging BE 에 아직 없는 endpoint 를 가질 수 있다
- 로컬 개발 · 컴포넌트 테스트: MSW 유지

- **장점**: dev 가 진짜 통합 지점이 된다 (실 BE + DB 검증). feature 작업의 BE/FE 독립 개발 보존. [ADR-0005](./0005-orval-mock-transformer-and-no-response-wrapper.md) transformer 자산 유지. ADR-0006 escape hatch 를 정확히 발동.
- **단점**: MSW gate 로직이 "dev 브랜치 preview 제외" 분기로 복잡해진다. dev dogfood 가 staging BE 가용성에 의존한다.

### Option 3: MSW 완전 폐기 — 로컬·feature PR·dev·테스트 전부 실 BE

- **장점**: mock 레이어 완전 제거 → desync 위험원 소멸. 가장 단순.
- **단점**: feature FE 를 staging BE 에 endpoint 가 생기기 전에 만들 수 없다 → [development-workflow.md](../../how-to/development-workflow.md) 가 명시한 "BE/FE 독립 개발" 폐기. ADR-0005 transformer 무용지물. 로컬 개발이 staging 가용성에 의존.

### Option 4: 별도 staging 브랜치 (ADR-0006 Option 3 재고)

- **장점**: 환경 분리 명시적.
- **단점**: [ADR-0006](./0006-dev-as-staging.md) 이 이미 거부 — 2단계 브랜치 정책과 충돌, 머지 단계 추가.

## Decision

**Option 2 채택 — dev 브랜치 배포 환경만 실 staging BE 호출, feature PR preview·로컬·테스트는 MSW 유지.**

이 결정은 [ADR-0006](./0006-dev-as-staging.md) 을 **amend** 한다 (supersede 아님). ADR-0006 의 핵심 결정 — "dev = staging-like 환경, 별도 staging 브랜치 안 만듦" — 은 **유효하게 유지**된다. 본 ADR 이 바꾸는 것은 그 staging 의 **데이터 소스**: mock → 실 BE (dev 브랜치 한정). ADR-0006 이 escape hatch 로 미리 설계한 변경이므로 supersede 가 아니라 그 hatch 의 발동이다.

ADR-0006 의 3 layer 중 변경 범위:

| Layer                          | ADR-0006                                     | ADR-0010 (본 ADR)                                          |
| ------------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| 런타임 transport (customFetch) | envelope + MSW inner 양쪽 흡수               | **변경 없음** — 양쪽 wire format 그대로 처리               |
| MSW 활성 범위                  | 로컬 + 모든 Vercel preview (dev 브랜치 포함) | 로컬 + feature PR preview 만 — **dev 브랜치 preview 제외** |
| 인프라 (Vercel custom env)     | dev custom environment                       | dev custom env 유지 + staging BE URL env 변수 추가         |

### 근거

1. **ADR-0006 escape hatch 의 정시 발동** — "BE 도 dev 환경 필요" 가 그 hatch 의 조건. ADR-0009 이 staging BE 를 제공하며 조건이 충족됐다.
2. **dev 가 진짜 통합 지점이 된다** — ADR-0006 은 BE 통합 검증이 dev→main PR 직전까지 미뤄지는 갭을 인정했다. dev = 실 staging BE 면 그 갭이 dev 단계로 당겨진다.
3. **BE/FE 독립 개발 보존** — feature PR·로컬은 MSW 유지. [development-workflow.md](../../how-to/development-workflow.md) 의 병렬 개발 흐름(API 스펙 → orval codegen → BE/FE 병렬, FE 는 mock)이 feature 단계에서 그대로 작동한다. Option 3(완전 폐기)는 이를 깨뜨려 거부.
4. **ADR-0005 자산 유지** — orval mock transformer 는 feature PR·로컬·테스트에서 계속 쓰인다.
5. **silent-failure 위험의 부분 완화** — dev 에서 실 BE 를 보므로 mock ↔ BE wire format divergence 가 dev 단계에서 노출된다. (feature PR 의 mock 은 여전히 desync 가능하나, dev 통합 시 잡힌다.)

## Consequences

### 좋은 결과

- dev dogfood 가 실 BE + DB 검증 — 통합 문제를 main 전에 발견
- feature 작업의 BE/FE 독립성 유지 — feature PR 은 여전히 mock-driven, BE 대기 없음
- [ADR-0005](./0005-orval-mock-transformer-and-no-response-wrapper.md) transformer 와 ADR-0006 의 3-layer 구조 대부분 보존 — 변경 최소
- ADR-0006 escape hatch 가 설계대로 작동 — 미래를 내다본 ADR 위생의 배당

### 나쁜 결과

- MSW gate 로직 복잡도 ↑ — "dev 브랜치 preview 는 MSW off, 다른 preview 는 on" 분기. dev 브랜치 식별 메커니즘이 필요하다.
- dev dogfood 가 staging BE 가용성에 의존 — staging BE 다운 시 dev 환경도 영향. ADR-0006 의 "BE 의존 0" 장점 일부 상실.
- feature PR(mock) → dev(실 BE) 머지 시 동작 차이 가능 — feature preview 에서 정상이 dev 에서 깨질 수 있다. 단 이는 **의도된 것** — ADR-0006 의 "preview ≠ production" 위험을 "feature preview ≠ dev" 로 한 단계 앞당겨 더 일찍 잡자는 것.

### 중립적 결과

- main (production)은 변화 없음 — 여전히 실 production BE 호출
- staging BE 의 데이터 시드·리셋 정책은 별도 운영 결정 (후속)

## Notes

### 후속 작업 (별도 이슈)

- MSW gate 수정 — dev 브랜치 preview 제외 ([`packages/devtools/src/MSWProvider.tsx`](../../../packages/devtools/src/MSWProvider.tsx), career/plan 공용)
- dev 브랜치 식별 메커니즘 확정 — `VERCEL_TARGET_ENV` / `VERCEL_GIT_COMMIT_REF` 등 후보, 구현 시 결정
- Vercel dev custom environment 에 staging BE URL env 변수 추가 — [`infra/vercel/`](../../../infra/vercel/) terraform
- staging BE CORS 에 dev 브랜치 도메인 허용 — BE 측 (CEO)

### ADR-0006 과의 관계

amend. ADR-0006 본문·Status(Accepted) 유지, Related 에 본 ADR forward-link 추가. ADR-0006 의 "미래 변경 시 체크리스트" 가 여전히 유효하며 본 ADR 이 그 첫 적용 사례다.
