---
name: local-servers
description: Use when user asks to run/start local dev servers — "be 로컬 띄워줘", "api 서버 띄워", "bootRun", "career 띄워줘", "plan 띄워줘", "dev 서버", "로컬 서버" — or to stop them ("꺼줘"), check which port a worktree's server uses, or diagnose port conflicts (EADDRINUSE).
---

# 로컬 dev 서버 기동 (BE·career·plan)

## 포트 규칙 (핵심)

포트는 워크트리 이름으로 **계산**한다 — `.envrc`가 자동 설정하는 `CAREER_PORT`/`PLAN_PORT`와 동일 공식:

- `dev`·`main` 워크트리: career 3000, plan 3001
- 나머지: `base = 4000 + (cksum(워크트리명) % 490) * 2` → career `base`, plan `base+1`

```bash
wt="$(basename "$PWD")"; base=$(( 4000 + ($(printf '%s' "$wt" | cksum | cut -d' ' -f1) % 490) * 2 ))
```

포트 명시(-p) 기동이라 점유 시 Next.js가 **fail-fast(EADDRINUSE)** — 조용히 다른 포트로 밀리지 않는다. 같은 워크트리에서 중복 기동하면 Next가 포트와 무관하게 자체 차단한다("Another next dev server is already running" + 기존 PID 안내).

## BE (Spring Boot, 8080)

1. `curl -s localhost:8080/actuator/health` → `"UP"`이면 그대로 보고, 끝
2. 기동 (백그라운드): `cd <워크트리>/apps/api && ./gradlew bootRun` — 첫 빌드는 몇 분 걸림
3. health가 `UP` 될 때까지 폴링 (최대 ~3분)
4. 안내: 프로파일 `local`(기본) = H2 인메모리 + data.sql 자동 시드
   - OTP 시드 쌍 (send 생략 가능): 로그인 `01000000002`/`000002`, 가입 `01000000001`/`000001`
   - verify는 원샷 소모 + 5회 실패 락 — 재시작하면 전체 리셋
   - send로 만든 랜덤 코드: 서버 로그 또는 H2 콘솔(`/h2-console`, url `jdbc:h2:mem:db`)
   - Bruno는 환경 `local` 선택

## FE (career / plan)

1. 현재 워크트리 포트 계산 (위 공식)
2. `curl -s localhost:<포트>` 응답 있으면 이미 떠 있음 → 보고, 끝
3. 기동 (백그라운드, 레포 루트에서): `pnpm dev:career` / `pnpm dev:plan` — direnv가 포트 주입
   - direnv 미적용 셸(백그라운드 Bash 등)에선 `CAREER_PORT=<포트> pnpm dev:career`로 명시 주입
4. 응답 확인 후 URL 보고. 로컬 FE는 MSW mock 자동 적용 — mock 로그인: `01099`로 시작하는 번호 + OTP `123456`

## 서버 식별·중지

- 어느 워크트리 서버인지 확인: 포트 계산이 1차. 검증은 `ss -ltnp | grep :<포트>`로 PID 추출 → `readlink /proc/<PID>/cwd`로 워크트리 경로 대조 (WSL에서 next-server는 `lsof -sTCP:LISTEN` 매칭이 안 될 수 있음 — ss 사용)
- 중지는 **명시 요청 시에만**, 위 방법으로 포트→PID 특정 후 `kill <PID>`
- `pgrep -f` 금지 (자기 세션 매칭 self-kill 함정)
- 다른 워크트리 소유 서버는 사용자 확인 없이 죽이지 않는다
