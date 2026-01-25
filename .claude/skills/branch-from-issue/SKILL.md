---
name: branch-from-issue
description: GitHub Issue 번호 기반으로 브랜치 자동 생성. feature/#-description 또는 fix/#-description 형식으로 브랜치 생성 및 체크아웃
allowed-tools: Bash, Read, Grep
---

# Branch from Issue

GitHub Issue 번호를 기반으로 작업 브랜치를 자동 생성합니다.

## 사용 시점

- GitHub Issue 생성 후 작업을 시작할 때
- 이슈 번호가 할당된 작업을 진행할 때

## 브랜치 네이밍 규칙

```
<type>/<issue-number>-<short-description>
```

### 타입 선택

| 타입      | 사용 시기        |
| --------- | ---------------- |
| `feature` | 새로운 기능 개발 |
| `fix`     | 버그 수정        |

### 예시

```bash
# 이슈 #123: Add user profile upload
feature/123-add-profile-upload

# 이슈 #456: Fix login redirect loop
fix/456-login-redirect-loop

# 이슈 #789: Update API error handling
feature/789-update-error-handling
```

## 브랜치 생성 프로세스

```
1. 이슈 번호 및 제목 확인
   └─ gh issue view <issue-number>

2. 브랜치 타입 결정
   └─ 레이블 확인 (bug → fix, 기타 → feature)

3. main 브랜치 최신화
   └─ git checkout main
   └─ git pull origin main

4. 브랜치 생성 및 체크아웃
   └─ git checkout -b <type>/<issue>-<description>

5. (선택) Notion 보드 상태 업데이트
   └─ "Todo" → "In Progress"
```

## 사용 예시

### 예시 1: 기능 개발

**이슈 정보**:

- 번호: #123
- 제목: "Add user profile image upload"
- 레이블: `💻 FE`

**실행 명령**:

```bash
# 1. 이슈 확인
gh issue view 123

# 2. main 최신화
git checkout main
git pull origin main

# 3. 브랜치 생성
git checkout -b feature/123-add-profile-upload
```

**결과**:

- 브랜치: `feature/123-add-profile-upload`
- base: `main`

### 예시 2: 버그 수정

**이슈 정보**:

- 번호: #456
- 제목: "Fix login redirect loop"
- 레이블: `🐛 bug:FE`

**실행 명령**:

```bash
git checkout main
git pull origin main
git checkout -b fix/456-login-redirect-loop
```

**결과**:

- 브랜치: `fix/456-login-redirect-loop`
- base: `main`

## 자동화 스크립트 예시

```bash
#!/bin/bash
# branch-from-issue.sh

ISSUE_NUMBER=$1

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Usage: ./branch-from-issue.sh <issue-number>"
  exit 1
fi

# 이슈 정보 가져오기
ISSUE_TITLE=$(gh issue view $ISSUE_NUMBER --json title -q .title)
ISSUE_LABELS=$(gh issue view $ISSUE_NUMBER --json labels -q '.labels[].name')

# 브랜치 타입 결정
if echo "$ISSUE_LABELS" | grep -q "bug"; then
  TYPE="fix"
else
  TYPE="feature"
fi

# description 생성 (제목에서 추출, 소문자, 공백 → 하이픈)
DESCRIPTION=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr ' ' '-' | cut -c1-50)

BRANCH_NAME="${TYPE}/${ISSUE_NUMBER}-${DESCRIPTION}"

echo "Creating branch: $BRANCH_NAME"

# main 최신화
git checkout main
git pull origin main

# 브랜치 생성 및 체크아웃
git checkout -b "$BRANCH_NAME"

echo "✓ Branch created: $BRANCH_NAME"
echo "✓ Ready to start working on issue #${ISSUE_NUMBER}"
```

**사용법**:

```bash
chmod +x branch-from-issue.sh
./branch-from-issue.sh 123
```

## 브랜치 생성 규칙

### DO ✅

- main 브랜치에서 분기
- 이슈 번호 반드시 포함
- description은 짧고 명확하게 (50자 이내)
- 소문자와 하이픈 사용
- 작업 시작 전 main 최신화

### DON'T ❌

- 다른 브랜치에서 분기
- 이슈 없이 브랜치 생성
- 긴 브랜치명 (80자 초과)
- 대문자, 공백, 특수문자 사용
- 오래된 main에서 분기

## 브랜치 네이밍 좋은 예시

```bash
# 좋은 예
feature/123-add-profile-upload
fix/456-login-redirect
feature/789-update-error-handling

# 나쁜 예
feature/add-profile  # 이슈 번호 없음
Feature/123-Add-Profile-Upload  # 대문자 사용
feature/123-add-profile-image-upload-feature-with-s3-integration  # 너무 김
fix/bug  # 이슈 번호 및 설명 부족
```

## gh CLI 명령어

이슈에서 브랜치 생성 (GitHub CLI):

```bash
# 이슈 정보 확인
gh issue view 123

# 이슈 목록 보기
gh issue list

# 이슈 검색
gh issue list --label "💻 FE" --state open

# 이슈에서 브랜치 생성 (GitHub에서 지원)
gh issue develop 123 --checkout
```

## 문제 해결

### 브랜치가 이미 존재할 때

```bash
# 에러: fatal: A branch named 'feature/123-...' already exists.

# 해결 1: 기존 브랜치로 체크아웃
git checkout feature/123-add-profile-upload

# 해결 2: 브랜치 삭제 후 재생성 (주의!)
git branch -D feature/123-add-profile-upload
git checkout -b feature/123-add-profile-upload
```

### main이 오래되었을 때

```bash
# 현재 브랜치에서 main 변경사항 가져오기
git fetch origin main
git rebase origin/main

# 또는
git merge origin/main
```

### 잘못된 브랜치에서 작업을 시작했을 때

```bash
# 1. 변경사항 임시 저장
git stash

# 2. 올바른 브랜치 생성
git checkout main
git pull origin main
git checkout -b feature/123-add-profile-upload

# 3. 변경사항 복원
git stash pop
```

## 주의사항

- **항상 main에서 분기**: 다른 브랜치에서 분기하지 않음
- **작업 전 이슈 확인**: 이슈 번호와 내용 확인
- **브랜치명 일관성**: 팀 규칙에 맞게 작성
- **main 최신화**: 분기 전 반드시 pull

## 다음 단계

브랜치 생성 후:

1. 작업 진행
2. **commit-convention** 스킬로 커밋
3. **pr-from-issue** 스킬로 PR 생성

## 참고 문서

- [Git Workflow](../../../docs/GIT_WORKFLOW.md) - 브랜치 전략 및 네이밍
- [Issue Management](../issue-management/SKILL.md) - 이슈 생성 가이드
