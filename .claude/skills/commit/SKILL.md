---
name: commit
description: 변경사항을 Conventional Commits 형식으로 자동 커밋. "커밋", "commit", "변경사항 커밋" 등의 요청 시 자동 활성화
triggers:
  - 커밋
  - commit
  - 변경사항 커밋
  - 코드 커밋
  - git commit
allowed-tools: Bash, Read, Grep
---

# Commit

사용자가 "커밋해줘" 요청 시 자동으로 실행되어 전체 커밋 프로세스를 수행합니다.

## 자동 실행 프로세스

1. **변경사항 분석**: `git status`, `git diff` 실행
2. **최근 커밋 스타일 확인**: `git log` 분석
3. **Conventional Commits 메시지 생성**: 타입, scope, 설명, 이슈 번호 추출
4. **파일 스테이징**: `git add` 실행
5. **커밋 실행**: 생성된 메시지로 커밋
6. **결과 확인**: `git status` 재확인

## 트리거 키워드

이 스킬은 다음 키워드 감지 시 자동 활성화됩니다:

- "커밋해줘"
- "변경사항 커밋"
- "코드 커밋해"
- "commit"
- "git commit"

---

## 커밋 컨벤션

> **SSoT**: 커밋 메시지 형식, 타입/스코프 목록, 작성 가이드, 좋은/나쁜 예시는 [docs/how-to/git-workflow.md](../../../docs/how-to/git-workflow.md)의 "커밋 컨벤션" 섹션을 참조하세요.

핵심 형식: `<type>(<scope>): <description> (#issue)`

---

## AI 에이전트 실행 가이드

### 사용자가 "커밋해줘" 요청 시

```bash
# Step 1: 변경사항 분석 (병렬 실행)
git status                # 변경된 파일 목록
git diff                  # 변경 내용 상세
git log -5 --oneline      # 최근 커밋 스타일 확인

# Step 2: 변경사항 기반 커밋 메시지 생성
# - git diff 분석하여 주요 변경사항 파악
# - 적절한 type 결정 (feat/fix/docs/refactor/chore/test/style)
# - scope 결정 (career/plan/api/ui/config/infra)
# - 50자 이내 description 작성 (소문자, 현재형, 명령문)
# - 현재 브랜치에서 이슈 번호 추출 (feat/123-xxx → #123)

# Step 3: 스테이징 및 커밋 (순차 실행)
git add .
git commit -m "<type>(<scope>): <description> (#issue)"
git status                # 커밋 완료 확인
```

### 커밋 메시지 생성 로직

```typescript
// 1. git diff 분석
const changes = analyzeDiff()

// 2. type 결정
const type = determineType(changes)
// - 새 파일/기능 추가 → feat
// - 버그 수정 → fix
// - 문서만 변경 → docs
// - 리팩토링 → refactor
// - 설정/빌드 → chore
// - 테스트 추가 → test
// - 포맷팅만 → style

// 3. scope 결정
const scope = determineScope(changes.files)
// - apps/career/** → career
// - apps/plan/** → plan
// - apps/api/** → api
// - packages/ui/** → ui
// - 여러 범위 → 생략 또는 주된 범위 선택

// 4. description 작성
const description = summarizeChanges(changes)
// - 50자 이내
// - 소문자 시작
// - 현재형 동사 (add, fix, update, remove, refactor)
// - 마침표 없음

// 5. 이슈 번호 추출
const branch = getCurrentBranch() // feat/123-add-profile-upload
const issueNumber = extractIssueNumber(branch) // #123

// 6. 최종 메시지
const message = `${type}(${scope}): ${description} (${issueNumber})`
```

### 자동 체크리스트

커밋 전 자동으로 확인:

- [ ] 타입이 올바른가? (feat, fix, docs 등)
- [ ] scope가 적절한가? (career, plan, api 등)
- [ ] description이 50자 이내인가?
- [ ] description이 현재형, 명령문인가?
- [ ] 이슈 번호를 포함했는가? (#123)
- [ ] 불필요한 파일이 포함되지 않았는가? (.env, credentials 등)

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

- [Git Workflow](../../../docs/how-to/git-workflow.md) - 커밋 컨벤션, Commitlint 설정, 문제 해결
- [Conventional Commits](https://www.conventionalcommits.org/) - 공식 스펙
