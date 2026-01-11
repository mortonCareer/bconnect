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

exit 0
