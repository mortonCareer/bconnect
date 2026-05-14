# ADR-0006: dev 브랜치를 staging-like 환경으로 운용

- **Status**: Accepted
- **Date**: 2026-05-10
- **Deciders**: @manamana32321
- **Related**: [#307](https://github.com/mortonCareer/bconnect/pull/307), [#309](https://github.com/mortonCareer/bconnect/pull/309), [#313](https://github.com/mortonCareer/bconnect/pull/313), [ADR-0005](./0005-orval-mock-transformer-and-no-response-wrapper.md), [ADR-0009](./0009-dev-branch-staging-be.md) (이 ADR 을 amend)

## Context

[`docs/GIT_WORKFLOW.md`](../../how-to/git-workflow.md) 의 브랜치 전략은 `main` (production) + `dev` (개발) 2단계. dev 가 단순 통합 브랜치인지 staging-like 환경인지 명확하지 않았고, 그 모호함이 이번 세션 (2026-05-09 ~ 05-10) 의 silent failure 연쇄로 표면화.

발견 흐름:

1. PR [#300](https://github.com/mortonCareer/bconnect/pull/300) (orval 7→8 + transformer) 머지 후 dev dogfood 시 home `/` 의 feed 가 빈 화면 — 콘솔 errors 0, typecheck 0 의 silent failure
2. 디버깅: transformer 적용 부작용으로 generated MSW mock 의 wire format 이 envelope 없이 변경. customFetch 는 envelope only 처리 → silent reject
3. 또 dev dogfood 시 Vercel preview 에서 MSW 비활성 (NODE_ENV=production gate) → 실제 BE 호출 시도 → BE 미준비로 실패

이 모두 dev 가 "실서버 없이 mock 만으로 dogfood 가능한 staging" 이라는 암묵적 정책의 구체화 부재 때문. 정책이 코드/인프라 layer 별로 흩어져 있어 한 layer 만 바뀌면 다른 layer 가 깨짐.

또 같은 PR 머지 후 dev 브랜치 자체에는 고정 preview alias 가 없어 dogfood 마다 최신 PR alias 추적 필요 — 작업 흐름 비효율.

## Options

### Option 1: dev = staging-like (3 layer 동기화)

3개 layer 가 한 정책 (`dev = mock-driven staging`) 으로 동기화:

| Layer                | 구체                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **런타임 transport** | `customFetch` 가 BE envelope + MSW inner-only 두 wire format 흡수 (PR [#307](https://github.com/mortonCareer/bconnect/pull/307))            |
| **MSW gate**         | `NODE_ENV === 'development' \|\| NEXT_PUBLIC_VERCEL_ENV === 'preview'` (PR [#309](https://github.com/mortonCareer/bconnect/pull/309))       |
| **인프라**           | terraform `vercel_custom_environment` "dev" + `branch_tracking` equals "dev" (PR [#313](https://github.com/mortonCareer/bconnect/pull/313)) |

- **장점**:
  - 정책 한 곳 (이 ADR) 에서 결정 보존, 3 layer 가 그 적용
  - dev 브랜치 dogfood 가 BE 미완성 단계에서도 가능 — FE 단독 진행 가능
  - 미래 staging-only env 변수 (별도 Sentry env 등) 도입 시 자연스럽게 확장
- **단점**:
  - "왜 dev 가 mock 인가" 를 새 합류자에게 설명 필요 (이 ADR 이 그 답)
  - 3 layer 의 동기화 — 한 layer 만 바뀌면 silent 깨짐 (이번 세션이 그 사고)

### Option 2: dev = 단순 통합 브랜치 (mock 없음, BE 의존)

- **장점**: 단순. main 과 dev 의 차이는 머지 타이밍만
- **단점**:
  - BE 미완성 단계 (현재 Morton 상황) 에서 dev dogfood 불가
  - PR preview 배포 시도 BE 호출 시도 → 미준비로 실패 (#308 의 증상)
  - FE 의 BE 독립 개발 (`docs/development-workflow.md` 의 명시) 와 충돌

### Option 3: dev + 별도 staging 브랜치 (3단계)

main / staging / dev — 별도 staging 브랜치 도입.

- **장점**: 환경 분리 명시적
- **단점**:
  - 머지 단계 1개 더 (오버헤드)
  - Morton 의 [`docs/GIT_WORKFLOW.md`](../../how-to/git-workflow.md) 2단계 정책과 충돌
  - dev push 마다 staging 머지 또는 자동화 — 추가 작업

## Decision

**Option 1 (dev = staging-like)** 채택.

근거:

1. **BE 미완성 컨텍스트**: Morton 현재 BE 가 일부만 구현 (apps/api 의 endpoint 부분 완성). dev 브랜치에서 mock 으로 FE 단독 dogfood 필수. ADR-0004 (envelope) + ADR-0005 (transformer) 가 BE/FE 독립 개발의 기반이고, 이 ADR 이 그 BE/FE 분리의 환경 layer 정착.
2. **2단계 브랜치 정책 보존**: Option 3 의 별도 staging 브랜치는 [`docs/GIT_WORKFLOW.md`](../../how-to/git-workflow.md) 2단계 (main + dev) 와 충돌. 추가 머지 단계의 인지/도구 비용 큼.
3. **layer 별 적용 비용 작음**: 이번 세션의 #307/#309/#313 으로 이미 3 layer 적용 완료. 미래 변경은 이 정책에 정렬.
4. **escape hatch 가능**: 별도 dev-only env 변수 (예: 다른 Sentry environment, 다른 feature flag) 가 필요해지면 `vercel_custom_environment` 의 환경별 분리로 한정 도입.

## Consequences

### 좋은 결과

- dev 브랜치 dogfood 가 BE 의존 없이 FE 단독 가능 — BE 완성 대기 없음
- 정책의 "왜" 가 한 ADR 에 집중 — 미래 누군가 "dev 가 왜 mock?" 물을 때 한 번에 답
- Vercel 의 dev custom environment 가 별도 env 변수/도메인/protection 분리 — 미래 staging-only 설정 도입 시 자연스럽게 확장
- 3 layer 가 같은 정책의 적용 → 일관성 검증 가능 (한 layer 깨지면 dev dogfood 가 fail 로 알려줌)

### 나쁜 결과

- 3 layer 동기화 부담 — 한 layer 만 바뀌면 silent failure 위험. 이번 세션의 #306/#308 사고 사례
- Vercel preview 빌드의 번들 크기 약간 ↑ — MSW + mocks 가 preview 번들에 포함 (production 빌드는 tree-shake 로 0)
- "production 빌드와 preview 빌드의 동작 차이" 가 misleading 가능성 — preview 에서 정상이 production 에서 깨질 risk. 완화: PR preview deploy 외에 production-mode 로 로컬 빌드 (`pnpm build && pnpm start`) 시 BE 미준비로 실서버 호출 실패 → 그 사실 자체가 production 검증이 PR preview 와 다르다는 신호

### 중립적 결과

- main 머지 (production deploy) 시 MSW 비활성 + 실서버 호출 — 이때 BE 가 준비되어 있어야 함. 즉 dev → main 머지의 PR review 가 사실상 "BE 준비 확인" 단계. 별도 release checklist 항목으로 명시 가치

## Notes

### Layer 별 책임 정리

```
[layer]                    [구체]                                      [PR]
런타임 transport          customFetch wire format 흡수                #307
MSW provider gate         NODE_ENV + NEXT_PUBLIC_VERCEL_ENV          #309
인프라 (Vercel)           vercel_custom_environment branch_tracking  #313
```

### 미래 변경 시 체크리스트

- env 변수 추가: dev environment 도 명시 (`vercel_project_environment_variable.target` 에 추가)
- 새 endpoint 추가: MSW handler / mock generator 가 envelope 없이 inner data 만 보내는지 확인 (transformer 일관성)
- BE wire format 변경 (예: envelope 제거): customFetch 의 분기 로직 + ADR-0004 (envelope) 재평가

### 대안 escape hatch

미래 dev 가 staging 로 부족하다면 (예: BE 도 dev 환경 필요):

- `vercel_custom_environment` 에 별도 env 변수 분리 — dev-only `NEXT_PUBLIC_API_URL` 로 staging BE 호출
- 또는 별도 staging 브랜치 도입 (Option 3) — ADR 갱신으로 정책 변경

> **2026-05-14 발동**: 첫 번째 hatch 가 [ADR-0009](./0009-dev-branch-staging-be.md) 로 발동됨 — [ADR-0008](./0008-be-db-hosting-railway-staging.md) 이 Railway staging 환경을 추가하면서, dev 브랜치 배포 환경이 실 staging BE 를 호출하도록 변경. 본 ADR 의 "dev = staging-like" 핵심 결정은 유효하며, 데이터 소스(mock → 실 BE)만 dev 브랜치 한정으로 amend 됐다.

### 관련 코드

- [`packages/api-client/src/client.ts`](../../../packages/api-client/src/client.ts) — customFetch wire format 흡수
- [`apps/career/src/components/msw-provider.tsx`](../../../apps/career/src/components/msw-provider.tsx), [`apps/plan/src/components/msw-provider.tsx`](../../../apps/plan/src/components/msw-provider.tsx) — MSW gate
- [`infra/vercel/projects.tf`](../../../infra/vercel/projects.tf) — `vercel_custom_environment.career_dev`, `vercel_custom_environment.plan_dev`
