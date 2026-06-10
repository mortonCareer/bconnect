# ADR-0018: Vercel 네이티브 Skip Unaffected Projects 채택 (커스텀 ignore_command 폐기)

- **Status**: Accepted
- **Date**: 2026-06-02
- **Deciders**: CTO (@manamana32321)
- **Related**: [#453](https://github.com/mortonCareer/bconnect/issues/453), [PR #455](https://github.com/mortonCareer/bconnect/pull/455)(머지+apply 완료), [ADR-0006](./0006-dev-as-staging.md), [ADR-0010](./0010-dev-branch-staging-be.md), [ADR-0022](./0022-drop-vercel-preview-team-owner-shared-account.md)(PR 프리뷰 폐기로 프리뷰 측면 무력화), [Vercel — Skipping unaffected projects](https://vercel.com/docs/monorepos#skipping-unaffected-projects). 선행 땜질 이력: #440, #443, #445

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

**Option 2를 채택한다.** 우선시한 force는 **견고성(QA 차단 해소)과 유지보수 종료**다. 손짠 메커니즘 자체가 #440/#443/#453 반복 땜질의 근원이므로, 정밀 수술(Option 1)이 아니라 메커니즘을 플랫폼에 위임해 폐기한다. 받아들인 트레이드오프는 (a) global change 시의 over-build, (b) dev 무조건 빌드 정책 상실, (c) Terraform 명시성 일부 손실이다 — 이들은 "native skip 작동"을 전제했으나, 실측에서 그 전제가 거짓으로 판명됐다(실현 동작 = always-build). 아래 "실측 정정" 참조.

## Consequences

- **좋은 결과 (실현됨)**:
  - shallow-clone false-skip **소멸** — 스킵 메커니즘 자체가 사라져 feature 브랜치 후속 푸시가 매번 신뢰성 있게 빌드(#453 본 증상 직접 해결)
  - 손짠 git-diff 스크립트 유지보수 사이클 종료(#440/#443/#445 반복 땜질의 근원 제거), 신규 의존성 0
- **나쁜 결과 (실현됨)**:
  - **매 푸시 career·plan 둘 다 빌드** — 아래 "실측 정정"대로 native skip이 작동하지 않아, 의도했던 앱별 dependency-graph 최적화는 **미달성**. 변경 무관하게 항상 두 앱 빌드(빌드 분↑, 단 false-skip 0으로 안전 방향).
- **중립적 결과**:
  - feature 프리뷰에 한해선 "항상 빌드"가 #453 목적(신뢰성 있는 QA 프리뷰)에 오히려 정합 — 스킵 최적화가 애초에 #453을 유발했으므로.
  - **Terraform 명시성**: 애초에 이 기능을 켜는 provider 속성이 없어 dashboard 토글("Skip deployment")에 의존하는 구조였고, 이 dashboard 의존성이 아래 미작동의 유력 원인이기도 하다.

## 실측 정정 (2026-06-02)

채택 당시 가정 — "`ignore_command`를 제거하면 Vercel 네이티브 Skip Unaffected Projects(기본 ON)가 인계받아 앱별 의존성 그래프로 조건부 빌드한다" — 은 **라이브 검증에서 거짓으로 판명**.

- **실측(PR #460)**: `commandForIgnoringBuildStep = None`(apply 확인)에도 docs-only 첫 푸시·후속 푸시가 **모두** career·plan을 빌드 → native skip이 스킵하지 않음. Vercel REST `v9/projects` 객체에 skip 관련 필드도 없음.
- **유력 원인**: 커스텀 Ignored Build Step을 두면 자동 skip이 비활성화되고, 제거해도 dashboard "Skip deployment" 토글이 자동 재활성화되지 않음(TF 미표현). 즉 ignore_command 제거 = Vercel 기본 "모든 연결 프로젝트를 매 푸시 빌드"로 복귀.
- **결론**: 이 ADR이 실제로 달성한 것은 **"손짠 ignore_command 폐기 → always-build → #453(거짓-스킵) 해소"**. 의도했던 그래프 최적화는 **미달성·보류**(CTO 결정 2026-06-02: 현 always-build 상태 수용 — 프리뷰 QA엔 오히려 적합). 향후 최적화 필요 시 (a) dashboard "Skip deployment" 토글 활성화 후 재검증, 또는 (b) tree-가드 버전의 올바른 ignore_command 재도입(별도 ADR supersede) 검토.

## Notes

- **적용 완료 (2026-06-02)**: PR #455 머지(`2778f2b`) → `terraform apply -target=module.vercel` (career/plan `ignore_command -> null`, **0 add / 2 change / 0 destroy**) → `terraform plan` 재확인 **"No changes"**. 라이브 Vercel 에서 ignore_command 제거됨.
- **실세계 검증 결과 (PR #460)**: docs-only 첫 푸시 + docs-only 후속 푸시 **둘 다 career·plan 빌드**(스킵 안 함). `commandForIgnoringBuildStep = None`(apply 확인). → native skip 미작동, 실현 동작은 **always-build**(상세는 위 "실측 정정"). #453(거짓-스킵)은 스킵 자체가 없어 해소.
- **모니터**: dev staging always-green 회귀가 없는지 디자이너 검수 사이클에서 관찰 (회귀 시 ADR-0006/0010 맥락 재검토).
