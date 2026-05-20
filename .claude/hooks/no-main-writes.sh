#!/bin/bash
# PreToolUse hook for Bash tool
# main 브랜치/워크트리에서 git write 작업 무조건 차단.
#
# 정책: 프로덕션 main 배포는 오직 인간이 통합용 PR을 통해서만.
# AI는 어떤 상황에서도 main에 직접 쓰지 않는다 (revert/hotfix 포함).
#
# 차단 조건:
# - tool: Bash
# - 명령에 git write 동사 포함 (commit, push, add, rm, reset, checkout, merge, cherry-pick, branch -D)
# - 실행 디렉토리가 main branch
#
# 우회 없음. main 작업이 진짜 필요하면 사용자 본인이 직접 쉘에서 실행.

input=$(cat)
command=$(echo "$input" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)
cwd=$(echo "$input" | grep -oP '"cwd"\s*:\s*"\K[^"]+' | head -1)

if [ -z "$command" ]; then
  exit 0
fi

# git write 동사 미포함이면 통과 (read-only는 OK)
if ! echo "$command" | grep -qE 'git[[:space:]]+(commit|push|add|rm|reset|checkout[[:space:]]+--|merge|cherry-pick|stash[[:space:]]+(pop|drop|clear)|branch[[:space:]]+-[Dd])'; then
  exit 0
fi

# 실행 디렉토리 결정: cd prefix > cwd field > $PWD
if echo "$command" | grep -qE '^[[:space:]]*cd[[:space:]]+'; then
  target=$(echo "$command" | grep -oP '^\s*cd\s+\K\S+' | head -1)
elif [ -n "$cwd" ]; then
  target="$cwd"
else
  target="$PWD"
fi

target=$(realpath "$target" 2>/dev/null || echo "$target")

if [ ! -d "$target/.git" ] && [ ! -f "$target/.git" ]; then
  exit 0
fi

branch=$(cd "$target" && git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ "$branch" = "main" ]; then
  cat >&2 <<EOF
🚫 BLOCKED: main 브랜치 git write 작업

  명령: $command
  디렉토리: $target

정책: 프로덕션 main 배포는 오직 인간이 통합용 PR을 통해서만.
AI는 어떤 상황에서도 main에 직접 쓰지 않습니다.

올바른 흐름:
  1. 다른 워크트리(feature/fix branch)에서 작업
     cd /home/json/morton-worktrees/<branch> && <command>
  2. PR을 통해 dev 브랜치로 머지
  3. 사용자가 직접 dev → main 통합 PR 머지
EOF
  exit 2
fi

exit 0