#!/bin/bash

# stdin에서 JSON 입력 읽기
input=$(cat)

# command 필드 추출 (jq 없이)
command=$(echo "$input" | grep -oP '"command"\s*:\s*"\K[^"\\]*(?:\\.[^"\\]*)*' | head -1)

# git commit 명령이 아니면 통과
if ! echo "$command" | grep -q "git commit"; then
  exit 0
fi

# HEREDOC 형식의 커밋 메시지 추출 (첫 번째 줄만)
message=$(echo "$command" | sed -n "/<<'EOF'/,/EOF/p" | sed '1d;$d' | head -1)

# HEREDOC이 없으면 -m 뒤의 메시지 추출
if [ -z "$message" ]; then
  message=$(echo "$command" | grep -oP '(?<=-m ")[^"]*' | head -1)
fi

if [ -z "$message" ]; then
  message=$(echo "$command" | grep -oP "(?<=-m ')[^']*" | head -1)
fi

# 메시지가 없으면 통과
if [ -z "$message" ]; then
  exit 0
fi

# commitlint로 검증
cd "$CLAUDE_PROJECT_DIR" || exit 0
result=$(echo "$message" | pnpm exec commitlint 2>&1)
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "commitlint 검증 실패:"
  echo "$result"
  echo ""
  echo "규칙: subject는 소문자로 시작해야 합니다 (예: feat(scope): add feature)"
  exit 2  # exit 2 = 도구 실행 차단
fi

exit 0
