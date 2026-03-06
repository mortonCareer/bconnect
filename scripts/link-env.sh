#!/usr/bin/env sh
# 워크트리에서 실행 시 main의 gitignored 설정 파일을 심링크
# pnpm prepare 단계에서 자동 실행됨

set -e

MAIN_WORKTREE=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
CURRENT=$(git rev-parse --show-toplevel)

# main 워크트리에서는 스킵
if [ "$CURRENT" = "$MAIN_WORKTREE" ]; then
  exit 0
fi

# 심링크할 gitignored 파일 목록 (main 기준 상대경로)
SHARED_FILES="
.env
apps/career/.env
apps/career/.env.local
apps/plan/.env
apps/plan/.env.local
apps/crawler/.env
infra/terraform.tfvars
"

linked=0
for rel in $SHARED_FILES; do
  src="$MAIN_WORKTREE/$rel"
  dst="$CURRENT/$rel"

  # main에 원본이 없으면 스킵
  [ ! -f "$src" ] && continue

  # 이미 심링크면 스킵
  [ -L "$dst" ] && continue

  # 이미 실제 파일이 있으면 스킵 (수동 복사한 경우 덮어쓰지 않음)
  [ -f "$dst" ] && continue

  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  echo "  linked: $rel"
  linked=$((linked + 1))
done

if [ $linked -gt 0 ]; then
  echo "  $linked env file(s) symlinked from main worktree"
fi
