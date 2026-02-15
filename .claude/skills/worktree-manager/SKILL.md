---
name: worktree-manager
description: Git worktree 기반 병렬 작업 관리. 워크트리 생성, 목록, 삭제 기능 제공.
allowed-tools: Bash, Read, Grep
---

# Worktree Manager

Git worktree를 활용하여 여러 이슈를 병렬로 작업할 수 있도록 관리합니다.

## 핵심 원칙

- **이슈1 - 워크트리1 - 브랜치1 - PR1**: 각 이슈는 독립된 워크트리에서 작업
- **브랜치 네이밍**: [Git Workflow](../../../docs/GIT_WORKFLOW.md)의 브랜치 전략 섹션 참조
- **독립 실행**: 각 워크트리에서 별도 터미널로 병렬 작업

---

## 브랜치 네이밍 규칙

> 상세 규칙은 [docs/GIT_WORKFLOW.md](../../../docs/GIT_WORKFLOW.md)를 참조합니다.

---

## 디렉토리 구조

```
/home/json/
├── morton/                          # 메인 레포 (main 브랜치)
└── morton-worktrees/                # 워크트리 루트
    ├── feat-57-input-component/
    └── fix-58-button-variant/
```

---

## 명령어

### 1. `worktree new <issue-number>`

새 워크트리를 생성합니다.

**프로세스**:

```bash
# 1. 이슈 정보 확인
gh issue view <issue-number> --json title,labels

# 2. 브랜치 타입 결정
# - bug 레이블 → fix
# - 기타 → feat

# 3. 브랜치명 생성 (GIT_WORKFLOW.md 규칙)
# <type>/<issue-number>-<short-description>

# 4. main 최신화
git -C /home/json/morton fetch origin main

# 5. 워크트리 + 브랜치 동시 생성
mkdir -p /home/json/morton-worktrees
git worktree add \
  /home/json/morton-worktrees/<branch-name-with-hyphens> \
  -b <type>/<issue-number>-<description> \
  origin/main

# 6. 설정 파일 복사
cp /home/json/morton/.env* <worktree-path>/ 2>/dev/null || true
cp -r /home/json/morton/.claude <worktree-path>/

# 7. 의존성 설치
cd <worktree-path> && pnpm install
```

**출력 예시**:

```
## Worktree 생성 완료

**이슈**: #57 - Add Input component
**브랜치**: feat/57-input-component
**경로**: /home/json/morton-worktrees/feat-57-input-component

다음 단계:
1. 해당 디렉토리에서 작업 진행
2. 커밋 시 "커밋해줘" 요청 (Conventional Commits 자동 적용)
3. 완료 시 "PR 만들어줘" 요청
```

### 2. `worktree list`

현재 워크트리 목록을 조회합니다.

**프로세스**:

```bash
# 1. Git 워크트리 목록
git worktree list

# 2. 각 브랜치에서 이슈 번호 추출
# feat/57-input-component → #57

# 3. 이슈별 PR 존재 여부 확인
gh pr list --head <branch-name> --json number,state
```

**출력 예시**:

```
## 현재 워크트리 목록

| 이슈 | 브랜치 | 경로 | PR |
|------|--------|------|----|
| #57 | feat/57-input-component | morton-worktrees/feat-57 | - |
| #58 | fix/58-button-variant | morton-worktrees/fix-58 | #59 |

총 2개 작업 중
```

### 3. `worktree remove <issue-number>`

워크트리를 삭제합니다 (PR 머지 후 정리용).

**프로세스**:

```bash
# 1. 워크트리 경로 확인
git worktree list | grep <issue-number>

# 2. 워크트리 삭제
git worktree remove <path>

# 3. 브랜치 삭제 (선택)
git branch -d <branch-name>
```

---

## 연동 스킬

| 시점    | 스킬          | 역할                             |
| ------- | ------------- | -------------------------------- |
| 커밋    | commit        | Conventional Commits + 이슈 번호 |
| PR 생성 | pr-from-issue | `Closes #<issue>` 자동 포함      |

---

## 주의사항

### DO

- 항상 main에서 분기 (origin/main 기준)
- 워크트리 생성 전 이슈 확인
- 설정 파일 복사 (.env, .claude/)

### DON'T

- 동일 이슈로 중복 워크트리 생성
- 머지 전 워크트리 삭제
- 메인 레포에서 `git checkout -b`로 직접 브랜치 생성

---

## 다음 단계

워크트리 생성 후:

1. 해당 디렉토리에서 작업 진행
2. **commit** 스킬로 커밋 (컨벤션 자동 적용)
3. **pr-from-issue** 스킬로 PR 생성
4. 머지 후 **worktree remove**로 정리

## 참고 문서

- [Git Workflow](../../../docs/GIT_WORKFLOW.md) - 브랜치 전략 및 네이밍
- [Commit](../commit/SKILL.md)
- [PR from Issue](../pr-from-issue/SKILL.md)
