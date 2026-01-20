#!/bin/bash

# PreToolUse hook for Bash tool
# 브랜치 생성 및 PR 생성 시 husky pre-push 스크립트 실행

# stdin에서 JSON 입력 읽기
input=$(cat)

# command 필드 추출
command=$(echo "$input" | grep -oP '"command"\s*:\s*"\K[^"\\]*(?:\\.[^"\\]*)*' | head -1)

# git checkout -b, git branch, git switch -c, gh pr create가 아니면 통과
if ! echo "$command" | grep -qE "git (checkout -b|branch|switch -c)|gh pr create"; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# 브랜치 생성 명령인 경우 - 새 브랜치명으로 husky 검증
if echo "$command" | grep -qE "git (checkout -b|branch|switch -c)"; then
  branch=$(echo "$command" | grep -oP '(checkout -b|branch|switch -c)\s+\K[^\s]+' | head -1)

  if [ -z "$branch" ]; then
    exit 0
  fi

  # husky pre-push 스크립트를 branch 변수로 실행
  export branch
  result=$(bash -c 'source "$CLAUDE_PROJECT_DIR/.husky/pre-push"' 2>&1)
  exit_code=$?

  if [ $exit_code -ne 0 ]; then
    echo "$result"
    exit 2
  fi
fi

# gh pr create 명령인 경우 - 현재 브랜치로 husky 검증
if echo "$command" | grep -q "gh pr create"; then
  result=$(bash "$CLAUDE_PROJECT_DIR/.husky/pre-push" 2>&1)
  exit_code=$?

  if [ $exit_code -ne 0 ]; then
    echo "$result"
    exit 2
  fi
fi

exit 0
