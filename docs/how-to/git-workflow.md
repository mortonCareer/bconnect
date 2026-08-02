# Git 워크플로우

> **For**: 모든 개발자.
> **You'll be able to**: 이슈 생성 → 브랜치 → 커밋 → PR → 머지 절차 수행.

Git 및 GitHub 사용 가이드

---

## 전체 플로우 (이슈 기반 개발)

```
GitHub Issue 생성 (#123)
    ↓
feat/123-description 브랜치 생성 (dev에서 분기)
    ↓
작업 진행 + 커밋
    ↓
PR 생성 → dev 브랜치 (Closes #123)
    ↓
CI 체크 (lint, format, BE 빌드/테스트)
    ↓
리뷰 및 승인
    ↓
dev 브랜치 머지
    ↓
dev → main PR 생성 (통합검증)
    ↓
통합 CI (api:generate + typecheck + 빌드)
    ↓
main 머지 → 프로덕션 배포
```

---

## 브랜치 전략

### 상시 브랜치

- **`main`**: 프로덕션 브랜치
  - 항상 배포 가능한 상태 유지
  - 직접 푸시 금지 (`dev`에서 PR을 통해서만 머지)
  - 머지 즉시 Vercel 자동 배포
  - 통합검증 CI: `api:generate` → typecheck → 빌드

- **`dev`**: 개발 브랜치 (GitHub 기본 브랜치)
  - BE 코드를 API 기준(SSOT)으로 하는 BE-first 개발 사이클 ([ADR-0015](../explanation/adr/0015-be-code-as-api-ssot.md)). 일반적으로 **BE 구현 → 스펙 갱신 → FE 작업** 순서로 진행
  - FE는 로컬에서 MSW mock으로 BE 미구현 상태에서도 작업 가능 (dev 배포는 dev BE(Railway)에 연동)
  - 모든 feature/fix PR의 타겟

### 작업 브랜치

모든 작업은 이슈를 먼저 생성한 후 `dev`에서 브랜치를 만듭니다.

**브랜치 네이밍:**

```
feat/#-short-description  # 새 기능
fix/#-short-description      # 버그 수정
```

### dev → main 머지 (릴리스)

릴리스 절차(릴리스 PR 생성 → merge commit 머지 → 태그·릴리스 노트·APK 첨부)는 [release.md](./release.md) 참조.

---

## 이슈 관리

### 이슈 생성

새로운 작업을 시작하기 전에 반드시 이슈를 생성합니다.

**이슈 템플릿:**

- **Bug Report**: 버그 리포트 (재현/예상/실제 구조)
- **Task**: 그 외 모든 작업 (기능/리팩토링/설정/문서)

### 이슈 레이블

레이블 목록의 SSoT는 GitHub 레이블 자체 — `gh label list` 로 실측합니다 (이름·설명 전부 실물에 있음). 규칙 두 가지만 기억하면 됩니다:

- 버그는 `🐛 bug` + 범위 레이블 조합 (예: `🐛 bug` + `💻 fe`)
- `🚨 sync-failure`, `🤖 figma-drift` 는 봇 전용 — 직접 붙이지 않기

이슈 템플릿/레이블: [.github/ISSUE_TEMPLATE/](../../.github/ISSUE_TEMPLATE/), 담당자 자동 할당은 [docs/reference/team.md](../reference/team.md) 참조.

---

## 커밋 컨벤션

### Conventional Commits

모든 커밋 메시지는 다음 형식을 따릅니다:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 커밋 타입

허용 타입의 SSoT는 [commitlint.config.js](../../commitlint.config.js)의 `type-enum`입니다. husky commit-msg 훅이 강제하며 위반 시 commit이 차단됩니다.

### Scope

작업 범위를 명시합니다 (선택적):

- `career`: Career 앱
- `plan`: Plan 앱
- `api`: Backend API
- `ui`: UI 패키지
- `config`: 설정 파일

### 이슈 번호 참조

커밋 메시지 끝에 이슈 번호를 추가합니다:

```
feat(career): add profile upload form (#123)
```

## PR (Pull Request) 프로세스

### PR 형식

PR 본문 템플릿: [.github/pull_request_template.md](../../.github/pull_request_template.md)

### PR 머지 방법

머지 케이스에 따라 전략이 다릅니다:

| 케이스              | 머지 방식        | 이유                                                        |
| ------------------- | ---------------- | ----------------------------------------------------------- |
| `feature/fix → dev` | **Squash**       | 작업 단위 압축, 임시 commit 정리                            |
| `dev → main` 통합   | **Merge commit** | dev의 PR 단위 보존, main에서 어떤 PR이 들어갔는지 추적 가능 |
