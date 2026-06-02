# ADR-0018: Vercel 네이티브 Skip Unaffected Projects 채택 (커스텀 ignore_command 폐기)

- **Status**: Accepted
- **Date**: 2026-06-02
- **Deciders**: CTO (@manamana32321)
- **Related**: [#453](https://github.com/mortonCareer/bconnect/issues/453), [PR #455](https://github.com/mortonCareer/bconnect/pull/455)(머지+apply 완료), [ADR-0006](./0006-dev-as-staging.md), [ADR-0010](./0010-dev-branch-staging-be.md), [Vercel — Skipping unaffected projects](https://vercel.com/docs/monorepos#skipping-unaffected-projects). 선행 땜질 이력: #440, #443, #445

## Context

BConnect는 pnpm 워크스페이스 모노레포다. Vercel 프로젝트 2개(`apps/career`, `apps/plan`)가 같은 GitHub 레포를 공유하고, 공유 패키지는 `@bconnect/{api-client,ui,config,mocks}` 4개다. 의존성 폐포 실측:

- career → `{api-client, ui, config, mocks}`
- plan → `{api-client, ui, config, mocks}`
- 패키지 간: `mocks → api-client`, `ui → config`

목표는 "본 앱 + 그 앱이 실제로 의존하는 패키지" 변경 시에만 해당 앱을 빌드하는 것이다 (모노레포 조건부 빌드).

기존 구현은 [infra/vercel/projects.tf](../../../infra/vercel/projects.tf)의 손으로 짠 `ignore_command`(Vercel Ignored Build Step)로, `git diff <prev_sha> HEAD --quiet -- apps/<app> packages`를 수행했다. 두 가지 결함이 있었다:

1. **견고성 결함 (실제 장애, #453)**: Vercel은 git을 shallow(`--depth=1`)로 clone한다. 두 번째 푸시부터 비교 기준 `COMPARE`(=직전 배포 SHA)는 shallow 경계 커밋이라 **commit 객체는 있으나 tree(스냅샷)는 fetch되지 않는다**. 가드 `git cat-file -e "$COMPARE"`는 commit 존재만 확인하고 통과 → `git diff`가 tree를 못 읽어 조용히 "변경 없음"(exit 0) → **빌드 거짓-스킵**. 결과적으로 feature 브랜치는 첫 푸시만 프리뷰가 뜨고 후속 푸시가 전부 스킵돼 팀 QA가 막혔다. #440/#443/#445는 같은 스크립트를 반복 땜질해온 이력이다.
2. **그래프 인지 부재**: `packages`를 통째 하드코딩 → 앱별 의존성 폐포를 반영하지 못한다. 오늘은 두 앱의 폐포가 동일해 우연히 일치하지만, 앱별 전용 패키지가 추가되면 깨진다.

## Options

### Option 1: 손짠 ignore_command 유지 + tree-reachability 가드

`git cat-file -e "$COMPARE"` → `git cat-file -e "$COMPARE^{tree}"`로 교체해 diff가 실제로 쓰는 tree 도달성을 확인(fail-open).

- **장점**: 최소 diff, 견고성 결함(1) root-cause 타격, 기존 최적화 유지
- **단점**: 그래프 인지 부재(2)는 미해결, 하드코딩 유지보수 부담 존속, 손짠 스크립트 = 빌드 슬롯 점유(취소돼도 배포/동시빌드 카운트 소모)

### Option 2: Vercel 네이티브 "Skip Unaffected Projects" (ignore_command 폐기) — 채택

`ignore_command`를 제거하고 Vercel 플랫폼 기능에 위임. Vercel이 `package.json`의 workspace 의존성을 읽어 앱별 폐포를 자동 계산하고, 소스/내부 의존성/관련 lockfile 변경 시에만 빌드한다. ([Vercel docs](https://vercel.com/docs/monorepos#skipping-unaffected-projects), last_updated 2026-03-17. 요구조건 — GitHub 연결·pnpm workspace·패키지 `name` 고유·의존성 명시 — BConnect 전부 충족.)

- **장점**: 그래프 인지 자동(2 해결, 자기유지) · git-diff를 안 해 shallow-clone 결함(1)이 구조적으로 발생 불가 · 빌드 슬롯 미점유로 큐 단축 · 신규 의존성/빌드시스템 0
- **단점**: workspace 정의 밖 변경(non-JS 경로)은 "global change"로 양쪽 앱 빌드(over-build) · dev "무조건 빌드" 명시 정책 표현 불가 · Terraform 명시 속성 부재(아래 Consequences)

### Option 3: turbo-ignore (Turborepo 도입)

- **장점**: 그래프 인지, Vercel fail-open
- **단점**: `turbo-ignore`는 [공식 deprecated](https://turborepo.dev/docs/reference/turbo-ignore)(→`turbo query affected`). 이거 하나 위해 Turborepo 전체(`turbo.json`+파이프라인+remote cache) 도입은 과잉

(pnpm `--filter "...[<ref>]"`·`nx affected`도 검토했으나, 둘 다 git-diff 기반이라 shallow-clone 견고성을 직접 떠안아야 해 Option 1과 동급의 부담이 남는다.)

## Decision

**Option 2를 채택한다.** 우선시한 force는 **견고성(QA 차단 해소)과 유지보수 종료**다. 손짠 메커니즘 자체가 #440/#443/#453 반복 땜질의 근원이므로, 정밀 수술(Option 1)이 아니라 메커니즘을 플랫폼에 위임해 폐기한다. 받아들인 트레이드오프는 (a) global change 시의 over-build, (b) dev 무조건 빌드 정책 상실, (c) Terraform 명시성 일부 손실이다 — 모두 안전 방향(over-build/기본값 ON)이며 아래에서 다룬다.

## Consequences

- **좋은 결과**:
  - 앱별 dependency closure 자동 계산 → `packages` 하드코딩 제거, 폐포가 갈라져도 자동 정합
  - shallow-clone false-skip이 구조적으로 소멸 (git-diff 미수행). `git cat-file` 가드 불필요
  - Ignored Build Step과 달리 동시 빌드 슬롯/배포 카운트 미점유 → 큐 시간 단축
  - 손짠 스크립트 유지보수 사이클 종료, 신규 의존성 0
- **나쁜 결과**:
  - **over-build (global change)**: workspace 정의 밖 경로(`apps/api`(Gradle)·`apps/crawler`(Python)·`docs/`·`infra/`·루트 설정)만 바뀐 커밋은 career·plan 양쪽을 빌드한다. 방향이 over-build(안전)지 false-skip(위험)이 아니다. BE 작업은 보통 `packages/api-client` spec 변경을 동반(→어차피 빌드)이라 순수 global-only 커밋 빈도는 낮다.
  - **dev 무조건 빌드 정책 상실**: 기존 스크립트의 `[ REF = dev ] && exit 1`(dev staging 항상 재배포, [ADR-0006](./0006-dev-as-staging.md)/[ADR-0010](./0010-dev-branch-staging-be.md)의 "preview 항상 green") 표현 불가. 단 native skip의 스킵은 "FE 미변경 → 직전 정상 배포가 곧 최신"을 의미하므로 `dev.bconnect.to`는 늘 올바른 최신 FE를 유지 → **always-green이 의미적으로 보존**된다. (env var 변경은 git push로 안 잡혀 기존 정책도 해결하지 못하던 영역 — 수동 redeploy 필요.)
- **중립적 결과**:
  - 오늘 career/plan 폐포가 동일(둘 다 4개 패키지 의존)해, native skip의 *빌드 선택*은 올바른 경로 필터와 결과가 같다. 이 변경의 가치는 견고성·자기유지·슬롯이지 오늘 당장 다른 빌드를 고르는 것이 아니다.
  - **Terraform 명시성**: provider에 이 기능을 켜는 속성이 없어 dashboard 기본값(자동 ON)에 의존한다. 끄려면 dashboard Root Directory "Skip deployment" 토글이며 Terraform이 drift를 추적하지 못한다. [infra/vercel/projects.tf](../../../infra/vercel/projects.tf)에 ADR/이슈 포인터 주석으로 의도를 박아 SSOT 추적성을 보완한다.

## Notes

- **적용 완료 (2026-06-02)**: PR #455 머지(`2778f2b`) → `terraform apply -target=module.vercel` (career/plan `ignore_command -> null`, **0 add / 2 change / 0 destroy**) → `terraform plan` 재확인 **"No changes"**. 라이브 Vercel 에서 ignore_command 제거됨.
- **실세계 검증 (이 PR, PR #460)**: native skip 의 스킵은 _직전 배포 대비_ **후속 푸시**에서 발동한다 — 첫 푸시는 비교 baseline 이 없어 안전하게 빌드(#460 1차 푸시도 docs-only 였지만 career·plan 양쪽 빌드됨, 예상대로). 따라서 검증은 후속 푸시로 한다: 이 PR 에 docs-only 후속 푸시 → 직전 배포 대비 앱·패키지 변경 0 → native skip 활성이면 career·plan 양쪽 **스킵**돼야 한다. ignore_command 는 이미 제거(apply 로 검증)됐으니, 스킵 발생 = native skip 이 유일 활성 메커니즘으로 작동 + 그래프 인지 확증. 결과는 PR 체크/코멘트에 기록.
- **남은 검증**: "관련 변경(`apps/**`·`packages/**`) 후속 푸시가 비대상 앱은 스킵하고 대상 앱은 재배포" = #453 본 증상의 정확한 재현은 다음 코드 feature PR 에서 관찰.
- **모니터**: dev staging always-green 회귀가 없는지 디자이너 검수 사이클에서 관찰 (회귀 시 ADR-0006/0010 맥락 재검토).
