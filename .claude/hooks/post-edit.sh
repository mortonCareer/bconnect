#!/bin/bash

# PostToolUse hook for Edit tool
# 원칙: 경고 전용 — 파일을 수정하지 않는다.
#
# 포맷팅(prettier·eslint --fix)은 pre-commit 의 lint-staged 가 담당하므로
# 여기서 하지 않는다. 훅이 파일을 수정하면 매 편집마다 변경 노트가
# 대화 컨텍스트에 재주입되어 토큰 비용이 큼.
# 예외: terraform fmt — lint-staged 미커버 + tf 편집 빈도가 낮아 허용.

input=$(cat)

file_path=$(echo "$input" | grep -oP '"file_path"\s*:\s*"\K[^"]+' | head -1)

if [ -z "$file_path" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 1. Terraform 파일 수정 시 → terraform fmt (lint-staged 미커버)
if echo "$file_path" | grep -q "\.tf$"; then
  if command -v terraform &> /dev/null; then
    terraform fmt "$file_path" > /dev/null 2>&1
  fi
fi

# 2. TSX/JSX 파일 수정 시 → Tailwind 하드코딩 값 검사 (경고만)
if echo "$file_path" | grep -qE "\.(tsx|jsx)$"; then
  # 예: [#386DFF], [50px], [1.6], [100%], [2rem], [calc(100%-20px)] 등
  hardcoded_values=$(grep -oE '\[[^"\]]+\]' "$file_path" 2>/dev/null | \
    grep -E '^\[(#[0-9A-Fa-f]{3,8}|[0-9]+(\.[0-9]+)?(px|rem|em|%|vh|vw|dvh|dvw|svh|svw)?|calc\(.*\))\]$' | \
    sort -u)

  if [ -n "$hardcoded_values" ]; then
    echo "⚠️  하드코딩된 Tailwind 값: $file_path — $(echo $hardcoded_values | tr '\n' ' ')"
    echo "   → 디자인 토큰 사용 (bg-primary, text-body2 등 — packages/ui/src/styles/globals.css)"
  fi
fi

exit 0