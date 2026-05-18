---
name: pr-from-issue
description: 이슈 기반 PR 자동 생성. 현재 브랜치에서 이슈 번호 추출, PR 제목/본문 생성, Closes #123 자동 추가
allowed-tools: Bash, Read, Grep
---

# PR from Issue

GitHub Issue 정보를 기반으로 Pull Request를 자동 생성합니다.

## 사용 시점

- 작업 완료 후 PR을 생성할 때
- 브랜치의 변경사항을 main에 머지하고 싶을 때

## PR 생성 프로세스

```
1. 현재 브랜치에서 이슈 번호 추출
   └─ feat/123-add-profile-upload → #123

2. 이슈 정보 가져오기
   └─ gh issue view 123

3. 변경 파일 분석
   └─ git diff main...HEAD

4. 리뷰어 자동 결정
   └─ apps/api/ 변경 포함 → CEO 추가
   └─ 프론트엔드만 변경 → 리뷰어 없음

5. PR 제목 생성
   └─ 이슈 제목 기반 (feat, fix 접두사 추가)

6. PR 본문 생성
   └─ Summary + Changes + Test + Closes #123

7. PR 생성
   └─ gh pr create (--reviewer 옵션 포함)

8. Vercel 프리뷰 배포 대기
   └─ 1-2분 소요

9. QA 진행
   └─ 프리뷰 URL에서 테스트
```

---

## PR 제목 형식

커밋 메시지와 동일한 Conventional Commits 형식:

```
<type>(<scope>): <description>
```

### 예시

```bash
# 이슈: "Add user profile image upload"
# PR 제목: "feat(career): Add user profile image upload"

# 이슈: "Fix login redirect loop"
# PR 제목: "fix(plan): Fix login redirect loop"
```

---

## PR 본문 템플릿

> **SSoT**: PR 본문 템플릿의 원본은 [.github/pull_request_template.md](../../../.github/pull_request_template.md)에 있습니다.
> PR 생성 시 해당 템플릿을 읽어서 본문을 채워 넣으세요.

템플릿 구조: Summary → Changes → Test → Screenshots → `Closes #이슈번호`

## 본문 quality 룰

PR 본문은 위 4-section 구조 + `Closes #N` 을 유지한다. 다음은 본문에 박지 말 것 — 결정 history, supersede 사유, 코드리뷰 반영 내역, ADR 번호 재할당, 정정 이력. ADR/이슈/git history 가 SoT.

### Section 별 룰

- **Summary** (1-3문장) — 첫 줄은 stand-alone 으로 의도 전달, 나머지는 Why
- **Changes** — 무엇 + 왜 그렇게 했나. 컴포넌트 구조표 X (코드가 SoT)
- **Test** — 검증 절차 + 결과
- **Screenshots** — UI 변경 시
- **Closes #N** — 이슈에 모든 깊이를 link out

### 권장 길이

| 종류              | 본문 길이         |
| ----------------- | ----------------- |
| 단순 fix/refactor | 200-500 bytes     |
| 일반 feature      | 600-1,200 bytes   |
| 복잡한 change     | 1,200-2,000 bytes |

상한 초과 시 self-check: "이 단락은 무엇/왜? Detail? ADR/이슈로 보낼 수 있는가?"

---

## 리뷰어 자동 할당

> **SSoT**: 리뷰어 할당 규칙과 GitHub 사용자명 매핑은 [docs/reference/team.md](../../../docs/reference/team.md)의 "PR 리뷰어 자동 할당" 섹션을 참조하세요.

### 감지 방법

```bash
# 변경 파일 확인
git diff main...HEAD --name-only

# apps/api/ 포함 여부 체크
if git diff main...HEAD --name-only | grep -q "^apps/api/"; then
  REVIEWER="<CEO_GITHUB>"
fi

# openapi.yaml 변경 시
if git diff main...HEAD --name-only | grep -q "openapi.yaml"; then
  REVIEWER="<CEO_GITHUB>,<CTO_GITHUB>"  # 둘 다
fi
```

---

## 자동화 스크립트 예시

```bash
#!/bin/bash
# pr-from-issue.sh

# 현재 브랜치에서 이슈 번호 추출
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ $BRANCH =~ ^(feat|fix)/([0-9]+)-(.+)$ ]]; then
  TYPE=${BASH_REMATCH[1]}
  ISSUE=${BASH_REMATCH[2]}
  DESC=${BASH_REMATCH[3]}
else
  echo "Cannot extract issue number from branch: $BRANCH"
  exit 1
fi

COMMIT_TYPE="$TYPE"

# 이슈 정보 가져오기
ISSUE_TITLE=$(gh issue view $ISSUE --json title -q .title)
ISSUE_BODY=$(gh issue view $ISSUE --json body -q .body)

# scope 추론 (레이블에서)
LABELS=$(gh issue view $ISSUE --json labels -q '.labels[].name')
if echo "$LABELS" | grep -q "career\|💻 fe"; then
  SCOPE="career"
elif echo "$LABELS" | grep -q "plan"; then
  SCOPE="plan"
elif echo "$LABELS" | grep -q "⚙️ be\|api"; then
  SCOPE="api"
else
  SCOPE=""
fi

# PR 제목 생성
if [ -n "$SCOPE" ]; then
  PR_TITLE="${COMMIT_TYPE}(${SCOPE}): ${ISSUE_TITLE}"
else
  PR_TITLE="${COMMIT_TYPE}: ${ISSUE_TITLE}"
fi

# PR 본문 생성
PR_BODY=$(cat <<EOF
## Summary

${ISSUE_TITLE}

## Changes

- TODO: List your changes here

## Test

- [ ] 로컬에서 테스트 완료
- [ ] 에러 케이스 확인
- [ ] 반응형 동작 확인

Closes #${ISSUE}
EOF
)

# PR 생성
echo "Creating PR: $PR_TITLE"
gh pr create \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --base main

echo "✓ PR created successfully"
echo "Vercel preview will be available in 1-2 minutes"
```

**사용법**:

```bash
chmod +x pr-from-issue.sh
./pr-from-issue.sh
```

---

## PR 생성 후 프로세스

```
PR 생성
    ↓
Vercel 프리뷰 자동 배포 (1-2분)
    ↓
GitHub PR 댓글에 프리뷰 URL 추가
    ↓
디자이너: UI 검수
    ↓
CTO: 코드 리뷰 + 기능 테스트
    ↓
CEO: 최종 QA
    ↓
수정 필요 시: 피드백 반영 → 재검수
    ↓
Approve
    ↓
Squash and Merge
    ↓
이슈 자동 닫힘 + 프로덕션 배포
```

---

## PR 체크리스트

PR 생성 전 확인 사항:

### 코드

- [ ] 린트 에러 없음 (`pnpm lint`)
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 타입 에러 없음 (TypeScript)
- [ ] 불필요한 콘솔 로그 제거
- [ ] 주석 처리된 코드 제거

### 테스트

- [ ] 로컬에서 기능 테스트 완료
- [ ] Happy Path 동작 확인
- [ ] 에러 케이스 처리 확인
- [ ] 로딩 상태 구현
- [ ] Empty State 처리

### UI/UX

- [ ] Figma 시안 대비 확인
- [ ] 반응형 동작 (모바일/태블릿/데스크톱)
- [ ] 버튼/링크 호버 상태
- [ ] 포커스 스타일

### 문서

- [ ] PR 본문에 변경사항 명시
- [ ] 테스트 항목 체크
- [ ] 관련 이슈 링크 (`Closes #123`)
- [ ] 스크린샷 첨부 (UI 변경 시)

---

## 문제 해결

### Vercel 프리뷰가 안 뜰 때

```bash
# 1. Vercel 빌드 로그 확인
# GitHub PR 댓글의 "Details" 클릭

# 2. 로컬에서 빌드 테스트
pnpm build

# 3. 에러 수정 후 재푸시
git add .
git commit -m "fix: resolve build error"
git push
```

### PR이 이슈를 자동으로 닫지 않을 때

PR 본문이나 커밋 메시지에 다음 중 하나를 포함해야 합니다:

```bash
Closes #123
Fixes #123
Resolves #123
```

**주의**: `Closes #123`은 PR이 **머지**될 때 이슈가 닫힙니다.

### Conflict 발생 시

```bash
# main 최신화
git checkout main
git pull origin main

# 작업 브랜치로 돌아가기
git checkout feat/123-add-profile-upload

# main 변경사항 가져오기
git rebase main
# 또는
git merge main

# 충돌 해결 후
git add .
git rebase --continue  # rebase 사용 시
# 또는
git commit  # merge 사용 시

# 푸시
git push --force-with-lease
```

---

## 주의사항

- **Draft PR**: 아직 리뷰가 필요 없으면 `--draft` 옵션 사용
- **작은 PR**: 한 PR에는 하나의 기능만 (300줄 이하 권장)
- **리뷰 요청**: 적절한 리뷰어 지정
- **테스트 완료**: PR 생성 전 충분히 테스트
- **Closes 키워드**: 이슈 자동 닫기를 위해 반드시 포함

---

## 다음 단계

PR 생성 후:

1. Vercel 프리뷰 URL에서 QA
2. 리뷰어 피드백 반영
3. Approve 후 Squash and Merge
4. 이슈 자동 닫힘 + 프로덕션 배포

---

## 참고 문서

- [Git Workflow](../../../docs/how-to/git-workflow.md) - PR 프로세스
- [QA & Testing](../../../docs/how-to/qa-and-testing.md) - QA 체크리스트
- [Deployment](../../../docs/how-to/deployment.md) - Vercel 프리뷰 배포
