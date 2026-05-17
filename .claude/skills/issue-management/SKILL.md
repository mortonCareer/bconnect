---
name: issue-management
description: GitHub Issue 생성 및 관리 자동화. 이슈 템플릿 선택, 레이블 자동 적용, 담당자 할당
allowed-tools: Bash, Read, Write, Grep
---

# Issue Management

GitHub Issue 생성을 자동화하고 적절한 레이블과 담당자를 할당합니다.

## 사용 시점

- 새로운 기능 개발을 시작할 때
- 버그를 발견했을 때
- 작업(Task)을 추적해야 할 때

## 이슈 템플릿

> **SSoT**: 이슈 템플릿의 원본은 [.github/ISSUE_TEMPLATE/](../../../.github/ISSUE_TEMPLATE/) 하위 파일만 사용

| 템플릿     | 용도                                      | 제목 접두사                                      |
| ---------- | ----------------------------------------- | ------------------------------------------------ |
| Bug Report | 버그 리포트 (재현/예상/실제 구조)         | `bug:`                                           |
| Task       | 그 외 모든 작업 (기능/리팩토링/설정/문서) | 작성자가 commit type 결정 (`feat:`/`chore:`/...) |

## 레이블

### 작업 범위 레이블

- `💻 fe` — 프론트엔드
- `⚙️ be` — 백엔드 (포괄)
- `⚙️be:api` — 백엔드 API 계층 (컨트롤러/DTO/엔드포인트)
- `⚙️be:service` — 백엔드 서비스 로직
- `📋 api-spec` — API 스펙 설계
- `🎨 publishing` — 퍼블리싱
- `☁️ infra` — 인프라
- `🤖 crawler` — 크롤러
- `🔧 chore` — 설정, 문서, CI/CD, 스킬/에이전트 수정

### 버그

`🐛 bug` 단일 레이블 + 범위 레이블 조합으로 표현.

예: `🐛 bug` + `💻 fe` = FE 버그, `🐛 bug` + `⚙️be:api` = BE API 계층 버그.

### 자동 봇 레이블 (사람이 직접 사용 X)

- `🚨 sync-failure` — GHA 동기화/헬스체크 실패 자동 이슈
- `🤖 figma-drift` — Figma drift 자동 감지 봇 이슈

## 레이블 자동 적용 규칙

| 키워드                                      | 레이블                 |
| ------------------------------------------- | ---------------------- |
| API 스펙, openapi.yaml                      | `📋 api-spec`          |
| 퍼블리싱, UI 마크업, HTML                   | `🎨 publishing`        |
| Spring Boot, Java, Backend (포괄)           | `⚙️ be`                |
| BE 컨트롤러/DTO/엔드포인트                  | `⚙️be:api`             |
| BE 서비스 로직                              | `⚙️be:service`         |
| Next.js, React, Frontend                    | `💻 fe`                |
| Vercel, Railway, AWS, 인프라                | `☁️ infra`             |
| 크롤러                                      | `🤖 crawler`           |
| 설정, 문서, CI/CD, 스킬, 에이전트, .claude/ | `🔧 chore`             |
| 버그 (모든 유형)                            | `🐛 bug` + 범위 레이블 |

## 담당자 할당 규칙

> **SSoT**: 담당자 할당 규칙과 GitHub 사용자명 매핑은 [docs/reference/team.md](../../../docs/reference/team.md)의 "GitHub 작업 매핑" 섹션을 참조

## 사용 예시

### 예시 1: 기능 개발 이슈

**입력**: "사용자 프로필 이미지 업로드 기능 추가"

**생성되는 이슈**:

- 제목: "feat: Add user profile image upload"
- 본문: Task 템플릿
- 레이블: `💻 fe`, `⚙️ be` (FE/BE 모두 필요)
- 담당자: CTO (FE), CEO (BE)

### 예시 2: 버그 리포트

**입력**: "로그인 후 프로필 페이지에서 전화번호가 표시되지 않음"

**분석**:

1. API 응답 확인 → phone 필드 있음
2. 화면에 표시 안 됨 → 프론트엔드 버그

**생성되는 이슈**:

- 제목: "bug: Profile page not showing phone number"
- 본문: Bug Report 템플릿 (자동 채워짐)
- 레이블: `🐛 bug`, `💻 fe`
- 담당자: CTO

### 예시 3: API 스펙 작업

**입력**: "사용자 프로필 조회 API 스펙 작성"

**생성되는 이슈**:

- 제목: "api-spec: User profile retrieval endpoint"
- 본문: Task 템플릿
- 레이블: `📋 api-spec`
- 담당자: CTO (초안), CEO (리뷰어)

## gh CLI 사용법

이슈 생성 시 `.github/ISSUE_TEMPLATE/`의 템플릿을 읽어 본문을 채워 넣습니다:

```bash
gh issue create \
  --title "feat: Add user profile upload" \
  --body "$(cat <<'EOF'
## 기능 설명

사용자가 프로필 이미지를 업로드할 수 있는 기능

## 요구사항

- [ ] 파일 업로드 폼 UI
- [ ] S3 업로드 로직
- [ ] 이미지 미리보기
- [ ] 업로드 에러 처리

## 참고 자료

EOF
)" \
  --label "💻 fe" \
  --label "⚙️ be" \
  --assignee <CTO_GITHUB> \
  --assignee <CEO_GITHUB>
```

이슈 조회:

```bash
gh issue list
gh issue view 123
```

## 주의사항

- 작업 시작 전 반드시 이슈 생성
- 이슈 번호는 브랜치명, 커밋 메시지에 포함
- 버그 이슈는 재현 방법을 명확히 작성
- 스크린샷/로그가 있으면 반드시 첨부

## 다음 단계

이슈 생성 후:

1. **worktree-manager** 스킬로 워크트리+브랜치 생성
2. 작업 진행
3. **commit** 스킬로 커밋
4. **pr-from-issue** 스킬로 PR 생성

## 참고 문서

- [Git Workflow](../../../docs/how-to/git-workflow.md) - 이슈 기반 개발 프로세스
- [QA & Testing](../../../docs/how-to/qa-and-testing.md) - 버그 판단 기준
