#!/bin/bash
# PreToolUse hook for Bash tool
# vercel CLI 실행 시 프로젝트/팀 명시 강제.
#
# 정책: vercel은 항상 --scope 또는 --cwd 인자로 명시 필수.
# .vercel/project.json (link) 신뢰 X — 사고로 생성된 link도 통과시킬 수 있음.
#
# 차단 조건:
# - tool: Bash
# - 명령에 vercel CLI 포함
# - 인자에 --cwd 또는 --scope 명시 없음
#
# 우회 없음. login/whoami 등 cwd-agnostic 명령도 차단 (사용자가 직접 쉘에서).

input=$(cat)
command=$(echo "$input" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)
cwd=$(echo "$input" | grep -oP '"cwd"\s*:\s*"\K[^"]+' | head -1)

if [ -z "$command" ]; then
  exit 0
fi

# vercel 명령 미포함이면 통과
if ! echo "$command" | grep -qE '(^|[[:space:]&|;])vercel([[:space:]]|$)'; then
  exit 0
fi

# 실행 디렉토리 결정: cd prefix > cwd field > $PWD
if echo "$command" | grep -qE '(^|;|&&)[[:space:]]*cd[[:space:]]+'; then
  target=$(echo "$command" | grep -oP '(^|;|&&)\s*cd\s+\K\S+' | head -1)
elif [ -n "$cwd" ]; then
  target="$cwd"
else
  target="$PWD"
fi

target=$(realpath "$target" 2>/dev/null || echo "$target")

# --cwd 또는 --scope 명시 시 통과
if echo "$command" | grep -qE -- '--(cwd|scope)([= ])'; then
  exit 0
fi

cat >&2 <<EOF
🚫 BLOCKED: vercel CLI 실행 시 프로젝트/팀 명시 누락

  명령: $command
  디렉토리: $target

정책: vercel은 항상 --scope 또는 --cwd 인자로 명시 필수.
모노레포 루트나 잘못된 link 디렉토리에서 무지성 실행 시 자동으로 새 프로젝트가 생성됩니다.

올바른 사용:
  1. vercel --scope morton-so <subcommand>   (팀 명시)
  2. vercel --cwd apps/career <subcommand>          (디렉토리 명시)

login/whoami 등 cwd-agnostic 명령은 사용자가 직접 쉘에서 실행.
EOF
exit 2