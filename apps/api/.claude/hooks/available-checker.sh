#!/bin/bash

DIR="${CLAUDE_PROJECT_DIR:-.}/.claude"
OUT=""

# 스킬 목록
for f in "$DIR"/skills/*/SKILL.md; do
  [ -f "$f" ] && OUT="$OUT- skill: $(basename "$(dirname "$f")")\n"
done

# 에이전트 목록
for f in "$DIR"/agents/*.md; do
  [ -f "$f" ] && OUT="$OUT- agent: $(basename "$f" .md)\n"
done

# 출력
if [ -n "$OUT" ]; then
  printf '{"decision":"approve","additionalContext":"Available:\\n%s\\nLoad required agents or skills before responding."}' "$OUT"
else
  printf '{"decision":"approve"}'
fi