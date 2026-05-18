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

## 본문 quality 룰

이슈 본문은 다음 항목만 담는다. 그 외(결정 history, ADR 발췌, 컴포넌트 내부 구조표, 정정 이력)는 본문에 박지 말고 링크/별도 파일로 분리.

1. **Why** (필수, 1-3문장) — 왜 이 작업이 필요한가
2. **재현** (버그일 때만) — steps to reproduce / 기대 / 실제 / (있으면) 스택 트레이스
3. **수락 조건** (기능일 때만, 1-3 체크리스트) — 검증 가능한 완료 기준
4. **관련 링크** — Figma 디자인 파일 / ADR / 인접 이슈, 모두 마크다운 링크
5. **Figma 노드 매핑** (UI 작업 시) — 구현 대상 Ready for Dev 노드 ID (단일 링크 또는 표)

### 권장 길이

| 종류         | 본문 길이                      |
| ------------ | ------------------------------ |
| 단순 task    | 1-3 줄                         |
| 일반 feature | 300-800 bytes (한글 100-250자) |
| 복잡한 bug   | 800-1,500 bytes                |

상한 초과 시 self-check: "이 단락은 Why? Detail? 링크로 보낼 수 있는가?"

## 레이블

레이블 목록 + 자동 적용 규칙은 [labels.md](../../../docs/reference/labels.md) 참조.

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
