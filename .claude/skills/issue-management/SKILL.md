---
name: issue-management
description: GitHub Issue 생성 및 관리. 이슈 템플릿 선택, 레이블 자동 적용
allowed-tools: Bash, Read, Write, Grep
---

# Issue Management

GitHub Issue 생성을 자동화하고 적절한 레이블을 적용합니다.

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

### 문체

- 합니다체 (해요체는 제품 UI 카피 전용)
- 과장 형용사·장식 이모지 금지
- 레포 파일 참조는 절대 blob URL (상대링크는 GitHub 본문에서 깨짐)

### 권장 길이

| 종류         | 본문 길이                      |
| ------------ | ------------------------------ |
| 단순 task    | 1-3 줄                         |
| 일반 feature | 300-800 bytes (한글 100-250자) |
| 복잡한 bug   | 800-1,500 bytes                |

상한 초과 시 self-check: "이 단락은 Why? Detail? 링크로 보낼 수 있는가?"

## 생성 방법

본문은 파일로 저장 후 `gh issue create --body-file <파일>` 로 전달한다 (inline `--body` 금지 — HEREDOC backtick escape 함정).

`gh issue create` 실행 시 [pr-issue-body-lint.sh](../../hooks/pr-issue-body-lint.sh) PreToolUse 훅이 길이 상한·이모지·--body-file 강제를 자동 검사한다. 차단되면 사유를 고쳐서 재시도.

## 레이블

레이블 목록의 SSoT는 GitHub 레이블 자체 — 붙이기 전 `gh label list` 로 실측한다. 규칙: 버그는 `🐛 bug` + 범위 레이블 조합, `🚨 sync-failure`·`🤖 figma-drift` 는 봇 전용(직접 사용 금지).

## 마일스톤

`gh api repos/{owner}/{repo}/milestones` 로 실측 후 적합한 마일스톤을 **추천**한다. 결정은 사용자.

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
