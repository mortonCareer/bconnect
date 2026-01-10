#!/bin/bash

# PostToolUse hook for Edit tool
# 파일 수정 후 자동 작업 수행

# stdin에서 JSON 입력 읽기
input=$(cat)

# file_path 추출
file_path=$(echo "$input" | grep -oP '"file_path"\s*:\s*"\K[^"]+' | head -1)

if [ -z "$file_path" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 1. OpenAPI 스펙 수정 시 → api:generate 제안
if echo "$file_path" | grep -q "openapi.yaml\|openapi.json"; then
  echo "💡 OpenAPI 스펙이 수정되었습니다. 'pnpm api:generate'로 클라이언트를 재생성하세요."
fi

# 2. Terraform 파일 수정 시 → terraform fmt 실행
if echo "$file_path" | grep -q "\.tf$"; then
  # terraform이 설치되어 있는지 확인
  if command -v terraform &> /dev/null; then
    terraform fmt "$file_path" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ Terraform 파일이 포맷팅되었습니다: $file_path"
    fi
  fi
fi

# 3. TSX 파일 수정 시 → Tailwind 하드코딩 값 검사
if echo "$file_path" | grep -qE "\.(tsx|jsx)$"; then
  # 하드코딩된 Tailwind arbitrary value 패턴 검사
  # 예: [#386DFF], [50px], [1.6], [100%], [2rem], [calc(100%-20px)] 등
  hardcoded_values=$(grep -oE '\[[^"\]]+\]' "$file_path" 2>/dev/null | \
    grep -E '^\[(#[0-9A-Fa-f]{3,8}|[0-9]+(\.[0-9]+)?(px|rem|em|%|vh|vw|dvh|dvw|svh|svw)?|calc\(.*\))\]$' | \
    sort -u)

  if [ -n "$hardcoded_values" ]; then
    echo "⚠️  하드코딩된 Tailwind 값이 발견되었습니다: $file_path"
    echo "   발견된 값: $(echo $hardcoded_values | tr '\n' ' ')"
    echo "   → Tailwind 테마 변수 사용을 권장합니다"
    echo "   → 컬러: bg-morton-blue, text-morton-text 등"
    echo "   → 크기: spacing 테마 변수 사용 권장"
  fi
fi

# 4. Markdown 파일 수정 시 → Prettier 자동 포맷팅
if echo "$file_path" | grep -qE "\.md$"; then
  if command -v pnpm &> /dev/null; then
    pnpm prettier --write "$file_path" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ Markdown 파일이 포맷팅되었습니다: $file_path"
    fi
  fi
fi

exit 0
