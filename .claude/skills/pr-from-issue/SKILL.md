---
name: pr-from-issue
description: 이슈 기반 PR 생성. 현재 브랜치에서 이슈 번호 추출, PR 제목/본문 생성, Closes #123 자동 추가. 본문은 quality 룰 준수
allowed-tools: Bash, Read, Grep
---

# PR from Issue

GitHub Issue 정보를 기반으로 Pull Request를 생성합니다.

## 사용 시점

- 작업 완료 후 PR을 생성할 때
- 브랜치의 변경사항을 dev에 머지하고 싶을 때 (모든 feature/fix PR 의 타겟은 `dev`. `main` 은 dev → main 통합 PR 로만 들어간다)

## PR 생성 프로세스

```
1. 현재 브랜치에서 이슈 번호 추출
   └─ feat/123-add-profile-upload → #123

2. 이슈 정보 가져오기
   └─ gh issue view 123

3. 변경 파일 분석
   └─ git diff origin/dev...HEAD

4. PR 제목 생성
   └─ 이슈 제목 기반 (feat, fix 접두사 추가)

5. PR 본문 작성 → 파일로 저장
   └─ 아래 quality 룰 준수. 반드시 --body-file 로 전달 (inline --body 금지)

6. PR 생성
   └─ gh pr create --base dev --title "..." --body-file <파일>
   └─ 리뷰어 지정 금지 — --reviewer 옵션을 쓰지 않는다. 리뷰어는 사용자가 정한다
```

PR 생성 후 리뷰 프로세스와 QA(dev 환경 스프린트 단위)는 [git-workflow.md](../../../docs/how-to/git-workflow.md) 참조.

## PR 제목 형식

커밋 메시지와 동일한 Conventional Commits 형식:

```
<type>(<scope>): <description>
```

예: `feat(career): 프로필 이미지 업로드 추가`

- description 은 대문자 약어(BE, API 등)나 PascalCase 로 시작하지 않는다 — commitlint 가 차단함. 한글 시작은 통과
- squash 머지 시 PR 제목이 곧 dev 히스토리의 커밋 메시지가 된다. 제목 품질 = 히스토리 품질

## PR 본문 템플릿

> **SSoT**: PR 본문 템플릿의 원본은 [.github/pull_request_template.md](../../../.github/pull_request_template.md)에 있습니다.
> PR 생성 시 해당 템플릿을 읽어서 본문을 채워 넣으세요.

템플릿 구조: Summary → Changes → Test → Screenshots → `Closes #이슈번호`

## 본문 quality 룰

PR 본문은 위 4-section 구조 + `Closes #N` 을 유지한다 (해당 없는 섹션은 삭제). 원칙: **diff 가 이미 말하는 것은 쓰지 않는다. 본문은 diff 가 못 담는 것(왜, 검증, 링크)만 담는다.**

### Section 별 룰

- **Summary** (1-3문장) — 이 변경이 왜 필요한가. 문제/배경. 첫 줄은 stand-alone 으로 의도 전달
- **Changes** — 핵심 변경 + 왜 그렇게 했나(접근 선택 이유, 버린 대안). 변경 파일 나열·diff 재서술 금지. 컴포넌트 구조표 X (코드가 SoT)
- **Test** — **실제 수행한 검증만** 체크. 수행하지 않은 항목은 쓰지 않거나 "미수행" 명시. 허위 체크 금지
- **Screenshots** — UI 변경 시. 해당 없으면 삭제
- **Closes #N** — 이슈에 모든 깊이를 link out

### 박지 말 것

결정 history, supersede 사유, 코드리뷰 반영 내역, ADR 번호 재할당, 정정 이력 — ADR/이슈/git history 가 SoT.

### 문체

- 합니다체 (해요체는 제품 UI 카피 전용)
- 과장 형용사 금지 — comprehensive, robust, seamless, enhanced 류. "This PR introduces..." 류 filler 오프너 금지
- 장식 이모지 금지
- 레포 파일 참조는 절대 blob URL (상대링크는 GitHub 본문에서 깨짐)

### 권장 길이

| 종류              | 본문 길이         |
| ----------------- | ----------------- |
| 단순 fix/refactor | 200-500 bytes     |
| 일반 feature      | 600-1,200 bytes   |
| 복잡한 change     | 1,200-2,000 bytes |

상한 초과 시 self-check: "이 단락은 무엇/왜? Detail? ADR/이슈로 보낼 수 있는가?"

## 문제 해결

- **PR이 이슈를 자동으로 안 닫음**: 본문에 `Closes #123` / `Fixes #123` / `Resolves #123` 필요. 머지 시점에 닫힌다
- **dev 와 conflict**: [git-workflow.md](../../../docs/how-to/git-workflow.md) "문제 해결" 참조

## 다음 단계

1. 리뷰어 피드백 반영
2. Approve 후 Squash and Merge → 이슈 자동 닫힘
3. 배포는 dev → main 통합 시 ([deployment.md](../../../docs/how-to/deployment.md))

## 참고 문서

- [Git Workflow](../../../docs/how-to/git-workflow.md) - PR 프로세스
- [Deployment](../../../docs/how-to/deployment.md) - 배포
