#!/bin/sh
# 워크트리별 dev 서버 포트 계산 — 포트 공식의 단일 정의(SSOT)
# 사용: scripts/dev-port.sh career|plan
# dev·main 워크트리는 3000/3001, 나머지는 워크트리 이름 해시로 4000~4979 고정 포트
root="$(cd "$(dirname "$0")/.." && pwd)"
wt="$(basename "$root")"
if [ "$wt" = "dev" ] || [ "$wt" = "main" ]; then
  base=3000
else
  base=$((4000 + ($(printf '%s' "$wt" | cksum | cut -d' ' -f1) % 490) * 2))
fi
case "$1" in
  plan) echo $((base + 1)) ;;
  *) echo "$base" ;;
esac
