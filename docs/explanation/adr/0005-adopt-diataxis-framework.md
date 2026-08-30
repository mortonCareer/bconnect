# ADR-0005: Diataxis 4분할 + 디렉토리 구조 채택

- 상태: 승인됨
- 날짜: 2026-05-08 ([PR #289](https://github.com/mortonCareer/bconnect/pull/289) 머지일)
- 담당자: @manamana32321

## 개요

PR #289 직전 docs/ 상태:

- 모든 파일 flat 구조 · ALL_CAPS 네이밍. 예 `DEPLOYMENT.md`, `GIT_WORKFLOW.md`
- `DEPLOYMENT.md` 449줄에 세 type 혼재. How-to 는 배포 절차, Reference 는 URL/환경/권한, Explanation 은 인프라 선택 이유
- 신규 합류자는 "어디서 어떤 정보 찾을지" 모호. 모든 파일을 처음부터 끝까지 읽어야 함
- 새 docs 작성 시 "이거 어디 두지?" 결정 비용 매번 발생
- "죽은 docs" 누적. stale 검출 기준 부재. lychee 같은 자동화 룰 적용 대상도 불명확

문제 본질은 docs 의 type 혼재. 사용자 의도별 진입 경로 부재. 의도는 학습 · 작업 · lookup · 이해.

## 선택지

### 옵션 1: 현 flat 유지 + 가이드라인만

장점

- 변경 0, 학습 곡선 0

단점

- type 혼재 · 진입 경로 부재 문제 그대로
- "가이드라인" 만으로는 합류자 행동 변화 어려움. 강제 메커니즘 부재

### 옵션 2: Hugo / MkDocs / Docusaurus 같은 정적 사이트 생성기

전용 docs site 빌드. 별도 호스팅 필요. 예 docs.bconnect.to.

장점

- 풍부한 navigation, 검색, 버저닝
- 디자인 세련

단점

- 별도 빌드 파이프라인 · 호스팅 인프라 추가. 예 Vercel 별도 프로젝트
- GitHub UI 안에서 PR 리뷰 시 docs 미리보기 안 됨. 또는 추가 도구 필요
- SaaS 의존 ↑. 도구 자체 수명에 의존
- 개발자 2-3명 + 합류 예정인 Morton 규모에 과함

### 옵션 3: [Diátaxis](https://diataxis.fr) 4분할 디렉토리

사용자 의도별 디렉토리. `tutorials/` 학습, `how-to/` 작업, `reference/` 검색, `explanation/` 이해. GitHub UI 자체가 navigation.

장점

- 한 문서 = 한 type 강제 → type 혼재 자동 차단
- 새 docs 작성 시 type 별 의도 명확 → 위치 결정 자동
- 디렉토리 listing 자체가 인덱스 → 별도 ToC 관리 비용 0
- AI (Claude Code) 가 type 별 컨텍스트 자동 학습. `how-to/write-docs.md` 룰 한 곳만 보면 됨
- 추가 인프라 0. markdown + git
- Daniele Procida (Canonical, Django) 가 정제. Django / Cloudflare / Numpy / Gitlab 등 업계 광범 채택

단점

- 매번 새 docs 작성 시 type 결정 비용 발생. 한 번 학습 후에는 작은 비용
- 4 카테고리에 정확히 안 맞는 docs 는 분해 또는 cross-link 필요. 예 결정 + 절차 동시 문서

### 옵션 4: TheGoodDocs / Documentation System Project / 자체 framework

장점

- docs 분류 framework 다른 옵션

단점

- Diataxis 만큼 정제 / 채택률 낮음. 학습 자료 부족

## 결정사항

옵션 3 채택. Diataxis 4분할.

### 적용 형태

- 디렉토리 구조: `docs/{tutorials, how-to, reference, explanation}/`
- 진입점: 인간용 `docs/README.md`, AI 용 `docs/CLAUDE.md`. AI 진입점은 write-docs.md 로 향하는 thin pointer
- 작성 룰 헌법: `docs/how-to/write-docs.md`. 현재 deprecated
- ADR 자체가 Explanation 카테고리 안. 위치는 `docs/explanation/adr/`

### 룰 강제 메커니즘

- 메타데이터 강제: 모든 docs 상단 `대상: ... / 학습 목표: ...` 두 줄
- 길이 가이드 휴리스틱. 한 type = 한 파일이라 자연스레 길이 통제
- markdownlint + lychee CI [docs-lint.yml](../../../.github/workflows/docs-lint.yml) 가 룰 위반 / 깨진 링크 자동 차단

### 근거

- 정적 사이트 생성기는 Morton 규모에 과함. 소수 개발자 + 합류 예정 규모
- "한 문서 = 한 type" 강제가 type 혼재를 자동 차단. 가이드라인보다 강력
- AI 의 컨텍스트 효율 ↑. write-docs.md 룰 한 곳만 학습하면 모든 docs 의도 추론 가능
- GitHub UI 자체로 충분. 별도 인프라 0

## 기대 효과

- 좋은 결과:
  - 신규 합류자가 의도 별 진입 경로 즉시 파악. Diataxis 페이지 자체가 학습 자료
  - 새 docs 작성 시 "이거 어디 두지?" 결정 비용 ↓. 4 카테고리 중 택 1
  - GitHub UI 디렉토리 listing 만으로 navigation 충분 → 인덱스 매번 갱신 부담 0
  - lychee CI 가 검사 scope 명확 (`docs//*.md`)
  - ADR 가 Explanation 카테고리에 자연 포함. 결정 기록의 위치 자명
- 나쁜 결과:
  - 기존 type 혼재 docs 분해 비용. `how-to/deployment.md` 449줄 등이 대상. P1 follow-up
  - 4 카테고리 mapping 모호한 케이스는 분해 또는 cross-link 필요. 결정 + 절차 동시 등
  - "어디 두지" 결정 비용 발생. 한 번 학습 후 작은 비용이지만 0 은 아님
- 중립적 결과:
  - 외부 도구 SSoT (`reference/tools.md`) 와의 정합. 다른 docs 에서 외부 도구 인용 시 룰 명확화 (write-docs.md §4)

## 메모

- write-docs.md §1 가 _룰_. 본 ADR 가 _왜_ 의 컨텍스트.
- P1 follow-up: 기존 type 혼재 docs 분해. 대상은 `how-to/deployment.md`, `git-workflow.md`, `development-workflow.md`, `qa-and-testing.md`. 별도 이슈로 추적 예정
- 향후 docs 규모 ↑ 시 정적 사이트 생성기 재검토 가능. 본 ADR 를 supersede 하는 새 ADR 작성

## 참조

- [#288](https://github.com/mortonCareer/bconnect/issues/288) : 메타
- [PR #289](https://github.com/mortonCareer/bconnect/pull/289)
- [#301](https://github.com/mortonCareer/bconnect/issues/301) : 백필
