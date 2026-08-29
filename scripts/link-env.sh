#!/usr/bin/env sh
# 메인 워크트리로부터 현재 워크트리에 각 환경변수 파일에 대한 심볼릭 링크(바로가기)를 생성합니다.

set -e

# git 워크트리에서만 실행
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

MAIN_WORKTREE=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
CURRENT=$(git rev-parse --show-toplevel)

# 메인 워크트리인 경우 생략
if [ "$CURRENT" = "$MAIN_WORKTREE" ]; then
  exit 0
fi

# 대상 파일
SHARED_FILES="
.envrc.local
apps/api/.envrc.local
apps/career/.envrc.local
apps/company/.envrc.local
apps/crawler/.envrc.local
apps/plan/.envrc.local
infra/terraform.tfvars
"

linked=0
for rel in $SHARED_FILES; do
  src="$MAIN_WORKTREE/$rel"
  dst="$CURRENT/$rel"

  # 파일 없으면 생략
  [ ! -f "$src" ] && continue

  # 이미 링크가 있으면 생략
  [ -L "$dst" ] && continue

  # 이미 파일이 있으면 생략
  [ -f "$dst" ] && continue

  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  echo "연결됨: $rel"
  linked=$((linked + 1))
done

if [ $linked -gt 0 ]; then
  echo "메인 워크트리에서 환경변수 파일 ${linked}개를 연결했습니다"
fi
