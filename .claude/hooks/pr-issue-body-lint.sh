#!/bin/bash
# PreToolUse hook for Bash tool
# gh pr/issue create·edit 본문 quality 게이트.
#
# 배경: AI가 생성하는 PR/이슈 본문의 품질 룰은
# .claude/skills/pr-from-issue/SKILL.md, .claude/skills/issue-management/SKILL.md 에
# 정의되어 있으나 스킬은 호출을 건너뛰면 무력하다. 이 훅은 그중 기계 검증
# 가능한 룰만 결정적으로 강제한다. 강제 룰과 상한 수치의 SSoT 는 이 스크립트
# (스킬의 길이표는 종류별 권장 범위, 여기 상한은 그 표의 최대값과 동기).
#
# 검사 (gh pr create / gh pr edit):
# - --reviewer / --add-reviewer 사용 차단 (리뷰어는 사용자가 정함)
# - inline --body 차단 → --body-file 강제 (HEREDOC escape 함정 + 본문 검사 가능하게)
# - 본문 파일 사전 작성 강제 (같은 커맨드 안에서 heredoc 생성 → 린트 우회 방지)
# - 본문 길이 상한 2,000 bytes (이미지 라인 제외)
# - 이모지 차단 (UTF-8 바이트 프리픽스 매칭, 의존성 없음)
# - --title conventional commit 형식 + 선두 대문자 약어 차단
#   (husky commitlint 는 로컬 커밋만 검사. squash 머지 시 PR 제목이 dev 커밋
#    메시지가 되는데 머지는 GitHub 서버라 무방비 — 여기가 유일한 게이트)
#
# 검사 (gh issue create / gh issue edit):
# - inline --body 차단, 본문 파일 사전 작성 강제
# - 본문 길이 상한 1,500 bytes, 이모지 차단
#
# jq 없는 환경에서는 검사 없이 통과 (품질 게이트라 fail-open 허용).

command -v jq >/dev/null 2>&1 || exit 0

input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$cmd" ] && exit 0

case "$cmd" in
  *"gh pr create"*|*"gh pr edit"*) kind=pr ;;
  *"gh issue create"*|*"gh issue edit"*) kind=issue ;;
  *) exit 0 ;;
esac

# dev → main 통합(릴리스) PR 은 본문 형식이 다르므로 전체 skip
if [ "$kind" = "pr" ] && echo "$cmd" | grep -qE -- '--base[= ]"?main"?'; then
  exit 0
fi

violations=""
add() { violations="${violations}  - $1
"; }

# --- 커맨드 플래그 검사 ---

if [ "$kind" = "pr" ] && echo "$cmd" | grep -qE -- '--(add-)?reviewer'; then
  add "리뷰어 지정 금지: --reviewer/--add-reviewer 제거. 리뷰어는 사용자가 정합니다"
fi

# 타 팀원에게 알림이 가는 담당자 할당 금지 (셀프 할당만 허용)
asg=$(echo "$cmd" | sed -nE 's/.*--(add-)?assignee[= ]"?([^" ]+)"?.*/\2/p')
if [ -n "$asg" ]; then
  others=$(echo "$asg" | tr ',' '\n' | grep -vE '^@me$')
  if [ -n "$others" ]; then
    add "타 팀원 담당자 지정 금지($others): 알림이 가는 할당·리뷰어 지정은 자동화하지 않습니다. 셀프 할당(--assignee @me)만 허용"
  fi
fi

# --body-file 을 제거한 뒤에도 --body 가 남으면 inline body
stripped=$(echo "$cmd" | sed 's/--body-file//g')
if echo "$stripped" | grep -qE -- '--body[= ]'; then
  add "inline --body 금지: 본문을 파일로 저장 후 --body-file <경로> 로 전달"
fi

# --- 본문 파일 검사 ---

body_file=$(echo "$cmd" | sed -nE 's/.*--body-file[= ]"([^"]+)".*/\1/p')
[ -z "$body_file" ] && body_file=$(echo "$cmd" | sed -nE "s/.*--body-file[= ]'([^']+)'.*/\1/p")
[ -z "$body_file" ] && body_file=$(echo "$cmd" | sed -nE 's/.*--body-file[= ]([^ "]+).*/\1/p')

is_create=0
echo "$cmd" | grep -qE 'gh (pr|issue) create' && is_create=1

if [ "$is_create" = "1" ] && [ -z "$body_file" ]; then
  add "--body-file 누락: 본문을 파일로 저장 후 --body-file <경로> 로 전달"
fi

if [ -n "$body_file" ] && [ ! -f "$body_file" ]; then
  add "본문 파일($body_file) 없음: 같은 커맨드에서 생성하지 말고, 별도 커맨드로 먼저 작성 (상대경로면 절대경로 사용)"
fi

if [ -n "$body_file" ] && [ -f "$body_file" ]; then
  # 이미지·스크린샷 라인은 길이 계산에서 제외
  size=$(grep -vE '^!\[|<img ' "$body_file" | wc -c)

  if [ "$kind" = "pr" ]; then limit=2000; else limit=1500; fi

  if [ "$size" -gt "$limit" ]; then
    add "본문 ${size} bytes > 상한 ${limit}: diff 낭독·결정 history 제거, 깊이는 이슈/ADR 링크로 분리"
  fi

  # 이모지: U+1F000–1FFFF(F0 9F), U+2600–27BF(E2 98~9E), U+2B40–2B7F(E2 AD)
  if LC_ALL=C grep -qE $'\xF0\x9F|\xE2[\x98-\x9E\xAD]' "$body_file"; then
    add "이모지 금지: 본문에서 이모지 제거"
  fi
fi

# --- PR 제목 검사 ---

if [ "$kind" = "pr" ] && [ "$is_create" = "1" ]; then
  title=$(echo "$cmd" | sed -nE 's/.*--title[= ]"([^"]+)".*/\1/p')
  [ -z "$title" ] && title=$(echo "$cmd" | sed -nE "s/.*--title[= ]'([^']+)'.*/\1/p")
  if [ -n "$title" ]; then
    if ! echo "$title" | grep -qE '^(feat|fix|docs|refactor|chore|test|style)(\([a-z0-9,-]+\))?!?: .+'; then
      add "제목 형식 위반: '<type>(<scope>): <description>' (Conventional Commits)"
    fi
    subject=$(echo "$title" | sed -E 's/^[^:]+: //')
    if echo "$subject" | grep -qE '^[A-Z]{2,}'; then
      add "제목 description 이 대문자 약어로 시작: squash 머지 시 commitlint 정합 깨짐. 소문자/한글로 시작"
    fi
  fi
fi

[ -z "$violations" ] && exit 0

cat >&2 <<EOF
🚫 BLOCKED: PR/이슈 본문 quality 게이트

$violations
룰 상세: .claude/skills/pr-from-issue/SKILL.md, .claude/skills/issue-management/SKILL.md
사유를 수정한 뒤 재시도하세요.
EOF
exit 2
