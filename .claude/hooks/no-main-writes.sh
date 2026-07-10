#!/bin/bash
# PreToolUse hook for Bash tool
# 보호 브랜치(main/dev)/워크트리에서 git write 작업 무조건 차단.
#
# 정책:
# - main: 프로덕션 배포 브랜치. 통합용 PR을 통해서만 인간이 머지.
# - dev:  default 브랜치. 직접 push 시 CI 체크·PR 리뷰 절차가 생략됨.
# AI는 어떤 상황에서도 보호 브랜치에 직접 쓰지 않는다 (revert/hotfix 포함).
#
# 차단 조건:
# - tool: Bash
# - 명령에 git write 동사 포함 (commit, push, add, rm, reset, checkout, merge, cherry-pick, branch -D)
# - 실행 디렉토리가 main 또는 dev branch
#
# 우회 없음. 보호 브랜치 작업이 진짜 필요하면 사용자 본인이 직접 쉘에서 실행.

# 주의: grep -oP(\K, PCRE)는 non-UTF-8/미설정 locale의 Git Bash에서 실패해
# 빈 값을 반환하고 훅이 무력화된다. portable한 sed로 JSON 필드를 추출한다.
input=$(cat)
command=$(echo "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
cwd=$(echo "$input" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

if [ -z "$command" ]; then
  exit 0
fi

# git write 동사 미포함이면 통과 (read-only는 OK)
if ! echo "$command" | grep -qE 'git[[:space:]]+(commit|push|add|rm|reset|checkout[[:space:]]+--|merge|cherry-pick|stash[[:space:]]+(pop|drop|clear)|branch[[:space:]]+-[Dd])'; then
  exit 0
fi

# 실행 디렉토리 결정: cd prefix > cwd field > $PWD
if echo "$command" | grep -qE '^[[:space:]]*cd[[:space:]]+'; then
  target=$(echo "$command" | sed -n 's/^[[:space:]]*cd[[:space:]]\{1,\}\([^[:space:]]*\).*/\1/p' | head -1)
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

if [ "$branch" = "main" ] || [ "$branch" = "dev" ]; then
  cat >&2 <<EOF
🚫 BLOCKED: 보호 브랜치($branch) git write 작업

  명령: $command
  디렉토리: $target

정책: 보호 브랜치(main/dev)에는 오직 인간이 PR을 통해서만 반영합니다.
AI는 어떤 상황에서도 보호 브랜치에 직접 쓰지 않습니다.

올바른 흐름:
  1. feature/fix 브랜치에서 작업
     git switch -c feat/<이슈번호>-<설명> --no-track origin/dev
  2. PR을 통해 dev 브랜치로 머지
  3. 사용자가 직접 dev → main 통합 PR 머지
EOF
  exit 2
fi

exit 0