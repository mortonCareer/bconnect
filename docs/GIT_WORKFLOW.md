# Git 워크플로우

Morton 프로젝트의 Git 및 GitHub 사용 가이드입니다.

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
  - BE/FE 독립 — spec 변경 후 FE 가 새 endpoint 호출하는 PR 도 typecheck 통과 (orval 자동 생성). 단 runtime 검증은 BE 구현 후. 진정한 디커플 (BE 미구현 endpoint 호출하는 페이지의 preview 동작까지 보장) 은 [#171](https://github.com/mortonCareer/bconnect/issues/171) (MSW 도입) 후.
  - 모든 feature/fix PR의 타겟
  - CI: lint, format, BE 빌드/테스트, **FE typecheck 포함** (강제 green 정책)
  - spec 변경 PR 은 FE drift 해소 같이 진행하거나 즉시 follow-up PR
  - Vercel preview build 항상 green — 디자이너 검수 / 시각 QA 사이클 보장. spec 변경 후 BE 미구현 endpoint 의 runtime 은 [#171](https://github.com/mortonCareer/bconnect/issues/171) 도입 전까진 BE 구현 후 동작.

### 작업 브랜치

모든 작업은 이슈를 먼저 생성한 후 `dev`에서 브랜치를 만듭니다.

**브랜치 네이밍:**

```
feat/#-short-description  # 새 기능
fix/#-short-description      # 버그 수정
```

**예시:**

```bash
# 이슈 #123: Add user profile upload
feat/123-add-profile-upload

# 이슈 #456: Fix login redirect loop
fix/456-login-redirect-loop
```

### 브랜치 생성 방법

```bash
# 1. 이슈 번호 확인 (예: #123)
# 2. dev에서 최신 코드 가져오기
git checkout dev
git pull origin dev

# 3. 브랜치 생성 및 체크아웃
git checkout -b feat/123-add-profile-upload

# 4. 작업 진행...
```

**자동화 스킬 사용:**

`worktree-manager` 스킬을 사용하면 이슈 번호를 입력하는 것만으로 워크트리와 브랜치를 자동 생성합니다.

### dev → main 머지 (릴리스)

```bash
# dev에서 main으로 PR 생성
gh pr create --base main --head dev --title "release: v1.x.x"
```

통합검증 CI(`ci-integration.yml`)가 통과해야 머지 가능합니다. 실패 시 dev에서 수정 후 재시도합니다.

dev 브랜치는 BE/FE 독립 개발을 허용하므로 `openapi.yaml` ↔ FE 타입 drift가 누적될 수 있습니다. 통합은 일반적으로 스프린트 단위로 진행하되, 필요 시 CTO가 임의로 트리거할 수 있습니다. drift는 dev 브랜치에서 직접 수정하며, typecheck 에러가 많을 경우 AI agent에 초안 작성 위임 후 CTO 리뷰.

---

## 이슈 관리

### 이슈 생성

새로운 작업을 시작하기 전에 반드시 이슈를 생성합니다.

**이슈 템플릿:**

- **Bug Report**: 버그 리포트
- **Feature Request**: 새 기능 제안
- **Task**: 일반 작업

### 이슈 레이블

#### 작업 유형

| 레이블          | 용도          |
| --------------- | ------------- |
| `📋 api-spec`   | API 스펙 설계 |
| `🎨 publishing` | 퍼블리싱      |
| `⚙️ BE`         | 백엔드 개발   |
| `💻 FE`         | 프론트엔드    |
| `☁️ infra`      | 인프라        |

#### 버그 유형

| 레이블            | 담당      | 설명                              |
| ----------------- | --------- | --------------------------------- |
| `🐛 bug:api-spec` | 둘이 논의 | API 스펙 자체가 부족하거나 잘못됨 |
| `🐛 bug:BE`       | CEO       | 응답이 스펙과 다름                |
| `🐛 bug:FE`       | CTO       | 스펙대로 왔는데 화면 처리가 안 됨 |

### 이슈 처리 흐름

```
문제 발견
    ↓
GitHub Issue 생성 + 레이블 적용
    ↓
담당자 할당
    ↓
feat/# 또는 fix/# 브랜치 생성
    ↓
작업 진행 및 커밋
    ↓
PR 생성 (Closes #123)
    ↓
머지 후 이슈 자동 닫힘
```

**자동화 스킬 사용:**

`issue-management` 스킬을 사용하면 템플릿 선택과 레이블 적용이 자동으로 처리됩니다.

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

| 타입       | 설명                           |
| ---------- | ------------------------------ |
| `feat`     | 새로운 기능 추가               |
| `fix`      | 버그 수정                      |
| `docs`     | 문서 수정                      |
| `refactor` | 코드 리팩토링 (기능 변경 없음) |
| `chore`    | 빌드, 설정 파일 수정           |
| `test`     | 테스트 코드 추가/수정          |
| `style`    | 코드 포맷팅 (기능 변경 없음)   |

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

### 예시

```bash
# 기능 추가
feat(career): add user profile upload (#123)

# 버그 수정
fix(plan): resolve login redirect loop (#456)

# 문서 업데이트
docs: update API client usage guide

# 리팩토링
refactor(api): extract auth service logic

# 설정 변경
chore: update ESLint rules

# 테스트 추가
test(api): add user service unit tests
```

### 커밋 메시지 작성 가이드

**좋은 예:**

```
feat(career): add profile image upload

- Add file input component
- Implement S3 upload logic
- Add image preview
- Handle upload errors

Closes #123
```

**나쁜 예:**

```
update code
fix bug
WIP
```

**자동화 스킬 사용:**

`commit-convention` 스킬을 사용하면 커밋 메시지 포맷 검증과 제안을 받을 수 있습니다.

---

## PR (Pull Request) 프로세스

### PR 생성

작업이 완료되면 PR을 생성합니다.

**PR 제목:**

커밋 메시지와 동일한 형식:

```
feat(career): Add user profile upload
```

**PR 본문:**

```markdown
## Summary

사용자 프로필 이미지 업로드 기능 추가

## Changes

- 파일 업로드 폼 UI 구현
- S3 업로드 로직 추가
- 이미지 미리보기 기능
- 업로드 에러 처리

## Test

- [ ] 로컬에서 이미지 업로드 테스트 완료
- [ ] 에러 케이스 (파일 크기, 형식) 확인

Closes #123
```

### PR 생성 명령어

```bash
# 1. 변경사항 푸시
git push origin feat/123-add-profile-upload

# 2. GitHub에서 PR 생성
# 또는 gh CLI 사용:
gh pr create --title "feat(career): Add user profile upload" --body "..."
```

**자동화 스킬 사용:**

`pr-from-issue` 스킬을 사용하면 현재 브랜치에서 이슈 정보를 추출해 PR 제목/본문을 자동 생성합니다.

### PR 리뷰 프로세스

```
PR 생성
    ↓
Vercel 프리뷰 자동 배포 (1-2분 소요)
    ↓
디자이너: UI 검수 (프리뷰 URL)
    ↓
CTO: 코드 리뷰 + 기능 테스트
    ↓
CEO: 최종 QA (실사용자 관점)
    ↓
수정 필요 시: 피드백 반영 → 재검수
    ↓
Approve
    ↓
main 브랜치로 머지
```

### PR 머지 방법

머지 케이스에 따라 전략이 다릅니다:

| 케이스              | 머지 방식        | 이유                                                        |
| ------------------- | ---------------- | ----------------------------------------------------------- |
| `feature/fix → dev` | **Squash**       | 작업 단위 압축, 임시 commit 정리                            |
| `dev → main` 통합   | **Merge commit** | dev의 PR 단위 보존, main에서 어떤 PR이 들어갔는지 추적 가능 |
| `main → dev` sync   | **Merge commit** | main의 commit 히스토리 그대로 흡수                          |

공통:

- 머지 커밋 메시지는 PR 제목 사용
- 머지 즉시 이슈 자동 닫힘
- 프로덕션 자동 배포 (`main` 머지 시)

#### Sync PR (head=main)의 Vercel checks 예외

`main → dev` sync PR은 head가 `main`이라 Vercel preview가 main 코드를 빌드합니다. main에 typecheck drift 등 broken 상태가 있으면 preview가 실패하지만, 이는 sync PR이 만든 문제가 아니라 기존 main 상태를 비추는 것이므로 머지 금지 사유에 해당하지 않습니다. main의 drift는 다음 `dev → main` 통합 사이클에서 별도로 해소합니다.

---

## Vercel 프리뷰 배포

### 자동 배포

PR 생성 시 자동으로 프리뷰 환경이 배포됩니다:

```
PR 생성/업데이트
    ↓
Vercel 빌드 시작 (1-2분)
    ↓
프리뷰 URL 생성
    ↓
GitHub PR 댓글에 링크 추가
```

### 프리뷰 URL 예시

```
https://morton-career-git-feat-123-add-profile-upload-<team>.vercel.app
https://morton-plan-git-feat-123-add-profile-upload-<team>.vercel.app
```

### QA on Preview

프리뷰 환경에서 다음을 확인합니다:

- UI/UX 시안 대비 확인 (디자이너)
- 기능 동작 테스트 (CTO)
- 실사용자 관점 검증 (CEO)

상세 QA 프로세스: **[QA_AND_TESTING.md](./QA_AND_TESTING.md)** 참조

---

## 자동화 스킬

Git 워크플로우를 자동화하는 5가지 스킬이 있습니다:

### 1. issue-management

GitHub Issue 생성 및 관리 자동화

- 템플릿 선택 (bug/feat/task)
- 레이블 자동 적용
- 담당자 할당

### 2. worktree-manager

Git worktree 기반 병렬 작업 관리

- 이슈 번호 기반 워크트리+브랜치 동시 생성
- `feat/#-description` 형식 브랜치 네이밍 (위 브랜치 전략 참조)
- 워크트리 목록 조회 및 삭제

### 3. commit-convention

커밋 메시지 검증 및 생성

- Conventional Commits 형식 검증
- scope 추천
- 이슈 번호 자동 참조

### 4. pr-from-issue

이슈 기반 PR 생성 자동화

- 현재 브랜치에서 이슈 번호 추출
- PR 제목/본문 자동 생성
- `Closes #123` 자동 추가

### 5. notion-task-sync

Notion 보드와 Git 작업 동기화 (구현 예정)

- 이슈 생성 → Notion "Todo"
- 브랜치 생성 → "In Progress"
- PR 생성 → "QA"
- PR 머지 → "Done"

---

## 모범 사례

### DO ✅

- 작업 시작 전 반드시 이슈 생성
- 이슈 번호 기반 브랜치 생성
- 의미 있는 커밋 메시지 작성
- PR에 테스트 결과 명시
- 프리뷰 환경에서 충분히 테스트
- 리뷰어 피드백 적극 반영

### DON'T ❌

- main 브랜치에 직접 푸시
- 이슈 없이 브랜치 생성
- "WIP", "fix" 같은 애매한 커밋 메시지
- 여러 기능을 한 PR에 포함
- 테스트 없이 PR 생성
- 리뷰 없이 셀프 머지

---

## 문제 해결

### 브랜치가 dev와 충돌할 때

```bash
# 1. dev 최신화
git checkout dev
git pull origin dev

# 2. 작업 브랜치로 돌아가기
git checkout feat/123-add-profile-upload

# 3. dev 변경사항 가져오기
git rebase dev
# 또는
git merge dev

# 4. 충돌 해결 후 푸시
git push origin feat/123-add-profile-upload --force-with-lease
```

### PR 프리뷰가 안 뜰 때

- Vercel 빌드 로그 확인
- 빌드 에러 수정 후 재푸시
- 환경 변수 누락 확인

### 이슈가 자동으로 안 닫힐 때

PR 본문이나 커밋 메시지에 다음 중 하나를 포함해야 합니다:

```
Closes #123
Fixes #123
Resolves #123
```

---

## 다음 단계

- **개발 워크플로우**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- **QA 및 테스팅**: [QA_AND_TESTING.md](./QA_AND_TESTING.md)
- **배포**: [DEPLOYMENT.md](./DEPLOYMENT.md)
