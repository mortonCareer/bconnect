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

### 1. Feature Request (기능 제안)

```markdown
## 기능 설명

[기능에 대한 명확한 설명]

## 요구사항

- [ ] 요구사항 1
- [ ] 요구사항 2

## 참고 자료

[Figma, 관련 이슈 등]
```

**레이블**: 작업 유형에 따라 자동 적용

- `💻 FE` - 프론트엔드 작업
- `⚙️ BE` - 백엔드 작업
- `📋 api-spec` - API 스펙 설계
- `🎨 publishing` - 퍼블리싱
- `☁️ infra` - 인프라

### 2. Bug Report (버그 리포트)

```markdown
## 문제

[버그에 대한 명확한 설명]

## 재현 방법

1.
2.
3.

## 예상 동작

[정상적으로 동작해야 하는 방식]

## 실제 동작

[현재 발생하는 문제]

## 환경

- URL:
- 브라우저:
- 디바이스:

## 스크린샷

[필요 시 첨부]
```

**레이블**: 버그 유형에 따라 자동 적용

- `🐛 bug:FE` - 프론트엔드 버그
- `🐛 bug:BE` - 백엔드 버그
- `🐛 bug:api-spec` - API 스펙 버그

### 3. Task (일반 작업)

```markdown
## 작업 내용

[작업에 대한 설명]

## 체크리스트

- [ ] 항목 1
- [ ] 항목 2
```

**레이블**: 작업 유형 레이블

## 레이블 자동 적용 규칙

| 키워드                       | 레이블            |
| ---------------------------- | ----------------- |
| API 스펙, openapi.yaml       | `📋 api-spec`     |
| 퍼블리싱, UI 마크업, HTML    | `🎨 publishing`   |
| Spring Boot, Java, Backend   | `⚙️ BE`           |
| Next.js, React, Frontend     | `💻 FE`           |
| Vercel, Railway, AWS, 인프라 | `☁️ infra`        |
| 버그 + API 응답              | `🐛 bug:BE`       |
| 버그 + 화면, UI              | `🐛 bug:FE`       |
| 버그 + 스펙                  | `🐛 bug:api-spec` |

## 담당자 할당 규칙

> GitHub 사용자명 매핑은 **[docs/TEAM.md](../../../docs/TEAM.md)** 참조

| 작업 유형         | 담당자                         |
| ----------------- | ------------------------------ |
| `📋 api-spec`     | 둘이 논의 (CTO 작성, CEO 리뷰) |
| `🎨 publishing`   | CTO                            |
| `⚙️ BE`           | CEO                            |
| `💻 FE`           | CTO                            |
| `☁️ infra`        | CTO                            |
| `🐛 bug:api-spec` | 둘이 논의                      |
| `🐛 bug:BE`       | CEO                            |
| `🐛 bug:FE`       | CTO                            |

## 사용 예시

### 예시 1: 기능 개발 이슈

**입력**: "사용자 프로필 이미지 업로드 기능 추가"

**생성되는 이슈**:

- 제목: "feat: Add user profile image upload"
- 본문: Feature Request 템플릿
- 레이블: `💻 FE`, `⚙️ BE` (FE/BE 모두 필요)
- 담당자: CTO (FE), CEO (BE)

### 예시 2: 버그 리포트

**입력**: "로그인 후 프로필 페이지에서 전화번호가 표시되지 않음"

**분석**:

1. API 응답 확인 → phone 필드 있음
2. 화면에 표시 안 됨 → 프론트엔드 버그

**생성되는 이슈**:

- 제목: "bug: Profile page not showing phone number"
- 본문: Bug Report 템플릿 (자동 채워짐)
- 레이블: `🐛 bug:FE`
- 담당자: CTO

### 예시 3: API 스펙 작업

**입력**: "사용자 프로필 조회 API 스펙 작성"

**생성되는 이슈**:

- 제목: "api-spec: User profile retrieval endpoint"
- 본문: Feature Request 템플릿
- 레이블: `📋 api-spec`
- 담당자: CTO (초안), CEO (리뷰어)

## gh CLI 사용법

이슈 생성:

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
EOF
)" \
  --label "💻 FE" \
  --label "⚙️ BE" \
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

- [Git Workflow](../../../docs/GIT_WORKFLOW.md) - 이슈 기반 개발 프로세스
- [QA & Testing](../../../docs/QA_AND_TESTING.md) - 버그 판단 기준
