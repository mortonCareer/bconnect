---
name: commit-convention
description: Conventional Commits 형식으로 커밋 메시지 검증 및 생성. 타입, scope, 이슈 번호 자동 추가
allowed-tools: Bash, Read, Grep
---

# Commit Convention

Conventional Commits 형식에 맞는 커밋 메시지를 작성하고 검증합니다.

## 커밋 메시지 형식

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 구성 요소

| 요소          | 필수 | 설명                             |
| ------------- | ---- | -------------------------------- |
| `type`        | ✅   | 커밋 타입 (feat, fix, docs 등)   |
| `scope`       | 선택 | 변경 범위 (career, plan, api 등) |
| `description` | ✅   | 변경 사항 요약 (현재형, 명령문)  |
| `body`        | 선택 | 상세 설명 (여러 줄 가능)         |
| `footer`      | 선택 | 이슈 참조, Breaking Change 등    |

---

## 커밋 타입

| 타입       | 설명                           | 예시                                  |
| ---------- | ------------------------------ | ------------------------------------- |
| `feat`     | 새로운 기능 추가               | `feat(career): add profile upload`    |
| `fix`      | 버그 수정                      | `fix(plan): resolve login loop`       |
| `docs`     | 문서 수정                      | `docs: update API client usage`       |
| `refactor` | 코드 리팩토링 (기능 변경 없음) | `refactor(api): extract auth service` |
| `chore`    | 빌드, 설정 파일 수정           | `chore: update ESLint rules`          |
| `test`     | 테스트 코드 추가/수정          | `test(api): add user service tests`   |
| `style`    | 코드 포맷팅 (기능 변경 없음)   | `style: format with prettier`         |

---

## Scope (범위)

작업 범위를 명시합니다 (선택적):

| Scope    | 설명                  |
| -------- | --------------------- |
| `career` | Career 앱             |
| `plan`   | Plan 앱               |
| `api`    | Backend API           |
| `ui`     | UI 패키지             |
| `config` | 설정 파일             |
| `infra`  | 인프라 (Terraform 등) |

---

## 이슈 번호 참조

커밋 메시지 끝에 이슈 번호를 추가합니다:

```bash
feat(career): add profile upload form (#123)
```

**footer에 추가할 수도 있습니다:**

```bash
feat(career): add profile upload form

Add file input component with preview

Closes #123
```

---

## 예시

### 기본 커밋

```bash
feat(career): add user profile upload
```

### scope와 이슈 번호 포함

```bash
feat(career): add profile upload form (#123)
```

### body 포함

```bash
feat(career): add profile image upload

- Add file input component
- Implement S3 upload logic
- Add image preview
- Handle upload errors

Closes #123
```

### Breaking Change

```bash
feat(api)!: change user authentication flow

BREAKING CHANGE: Remove password-based auth, use OTP only

Closes #456
```

### 여러 파일 수정

```bash
refactor(career): extract form validation logic

- Move validation to separate utils
- Add unit tests
- Update form components to use new validation

Related to #789
```

---

## 커밋 메시지 작성 가이드

### Description 작성

- **현재형, 명령문 사용**: "add", "fix", "update" (not "added", "fixed", "updated")
- **대문자로 시작하지 않음**: `add` (not `Add`)
- **마침표 없음**: `add user profile` (not `add user profile.`)
- **50자 이내**: 간결하게 요약

### Body 작성 (선택)

- 변경 이유와 배경 설명
- 무엇을 변경했는지 (what) + 왜 변경했는지 (why)
- 여러 변경사항은 불릿 포인트 사용

### Footer 작성 (선택)

- `Closes #123`: 이슈 자동 닫기
- `Fixes #123`: 버그 이슈 자동 닫기
- `Resolves #123`: 이슈 해결
- `Related to #123`: 관련 이슈
- `BREAKING CHANGE:`: 호환성 깨지는 변경

---

## 좋은 커밋 메시지 예시

### ✅ 좋은 예

```bash
# 간결하고 명확
feat(career): add profile image upload

# scope와 이슈 번호 포함
fix(plan): resolve login redirect loop (#456)

# body로 상세 설명
feat(career): add profile upload form

- Add file input with drag & drop
- Implement S3 upload with progress
- Add image preview and crop
- Handle file size and type validation

Closes #123

# 여러 관련 작업
refactor(api): improve error handling

- Standardize error response format
- Add custom error codes
- Update error logging

Related to #789, #790
```

### ❌ 나쁜 예

```bash
# 너무 모호
update code

# 대문자 시작, 마침표
Fix Bug.

# 과거형
added profile upload

# 너무 김
feat(career): add user profile image upload feature with S3 integration and validation

# 스코프 없이 여러 범위 수정
feat: update career and plan apps

# WIP (Work In Progress) - 최종 커밋에 사용 금지
WIP
```

---

## 커밋 전 체크리스트

- [ ] 타입이 올바른가? (feat, fix, docs 등)
- [ ] scope가 적절한가? (career, plan, api 등)
- [ ] description이 50자 이내인가?
- [ ] description이 현재형, 명령문인가?
- [ ] 이슈 번호를 포함했는가? (#123)
- [ ] 린트 에러가 없는가? (pre-commit hook 통과)
- [ ] 불필요한 파일이 포함되지 않았는가?

---

## Commitlint 설정

프로젝트는 Commitlint를 사용해 커밋 메시지 형식을 자동 검증합니다.

**설정 파일**: `commitlint.config.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'chore', 'test', 'style']],
    'scope-enum': [2, 'always', ['career', 'plan', 'api', 'ui', 'config', 'infra']],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 50],
  },
}
```

**검증 실패 시**:

```bash
# 에러: type이 잘못됨
git commit -m "update: fix bug"
# ✗ type must be one of [feat, fix, docs, ...]

# 에러: description이 대문자로 시작
git commit -m "feat: Add profile"
# ✗ subject must be in lower-case

# 에러: description이 너무 김
git commit -m "feat: add user profile image upload feature with s3"
# ✗ subject may not be longer than 50 characters
```

---

## Git Hooks (Husky + lint-staged)

커밋 전 자동으로 실행됩니다:

1. **lint-staged**: ESLint + Prettier 자동 수정
2. **commitlint**: 커밋 메시지 형식 검증

**Hook 설정**: `.husky/commit-msg`

```bash
#!/bin/sh
npx --no -- commitlint --edit $1
```

---

## 커밋 메시지 수정

### 마지막 커밋 수정 (아직 push 안 함)

```bash
# 커밋 메시지만 수정
git commit --amend -m "feat(career): add profile upload (#123)"

# 커밋 메시지를 에디터에서 수정
git commit --amend
```

### 이미 push한 경우

```bash
# ⚠️ 주의: force push 필요
git commit --amend
git push --force-with-lease
```

### 여러 커밋 수정 (interactive rebase)

```bash
# 최근 3개 커밋 수정
git rebase -i HEAD~3

# 에디터에서 "pick"을 "reword"로 변경
# 커밋 메시지 수정
```

---

## 자동 커밋 메시지 생성

현재 브랜치에서 이슈 번호와 타입 추출:

```bash
#!/bin/bash
# generate-commit-msg.sh

# 현재 브랜치 이름 가져오기
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 브랜치에서 이슈 번호와 타입 추출
if [[ $BRANCH =~ ^(feature|fix)/([0-9]+)-(.+)$ ]]; then
  TYPE=${BASH_REMATCH[1]}
  ISSUE=${BASH_REMATCH[2]}
  DESC=${BASH_REMATCH[3]}

  # feature → feat 변환
  if [ "$TYPE" = "feature" ]; then
    TYPE="feat"
  fi

  # 하이픈을 공백으로 변환
  DESC=$(echo "$DESC" | tr '-' ' ')

  echo "${TYPE}: ${DESC} (#${ISSUE})"
else
  echo "Cannot extract issue number from branch: $BRANCH"
fi
```

**사용법**:

```bash
./generate-commit-msg.sh
# 출력: feat: add profile upload (#123)

# 커밋에 사용
git commit -m "$(./generate-commit-msg.sh)"
```

---

## 문제 해결

### Commitlint 에러: type이 잘못됨

```bash
# 에러
✗ type must be one of [feat, fix, docs, refactor, chore, test, style]

# 해결: 올바른 타입 사용
git commit -m "feat: add profile upload"
```

### Commitlint 에러: subject가 대문자

```bash
# 에러
✗ subject must be in lower-case

# 해결: 소문자로 시작
git commit -m "feat: add profile upload"  # ✓
git commit -m "feat: Add profile upload"  # ✗
```

### Commitlint 에러: subject가 너무 김

```bash
# 에러
✗ subject may not be longer than 50 characters

# 해결: 간결하게 요약
git commit -m "feat(career): add profile upload"  # ✓ (39자)
git commit -m "feat(career): add user profile image upload feature"  # ✗ (54자)
```

---

## 주의사항

- **WIP 커밋 지양**: 최종 커밋은 의미 있는 메시지 작성
- **한 커밋에 한 가지 변경**: 여러 기능은 분리해서 커밋
- **린트 에러 없이 커밋**: pre-commit hook이 통과해야 함
- **이슈 번호 포함**: 추적 가능하도록 이슈 번호 추가

---

## 다음 단계

커밋 후:

1. 추가 작업 진행 또는
2. **pr-from-issue** 스킬로 PR 생성

## 참고 문서

- [Git Workflow](../../../docs/GIT_WORKFLOW.md) - 커밋 규칙 및 예시
- [Conventional Commits](https://www.conventionalcommits.org/) - 공식 스펙
