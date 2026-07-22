---
match:
  - 'mortonCareer/bconnect'
---

# bconnect (Morton) FE QA 프로파일

pnpm 모노레포. FE 앱 2개: career(기술자 PWA), plan(업체 웹). BE: Spring Boot (apps/api).

## 환경

| env         | FE                                                                                                    | BE                                                                                          | 비고                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| local(mock) | localhost 기동 (`pnpm dev:career` / `dev:plan`, 포트는 워크트리별 자동 할당 — `scripts/dev-port.sh`)  | MSW mock                                                                                    | 로컬 `pnpm dev` 기본값. 실계약 미검증                        |
| local(be)   | 상동 + `.env.local`에 `NEXT_PUBLIC_API_URL=http://localhost:8080`, `NEXT_PUBLIC_API_MOCKING=disabled` | H2 인메모리 (`SPRING_PROFILES_ACTIVE=local ./gradlew bootRun`, schema-h2.sql+data.sql 시드) | 실계약 검증 표준 경로. CORS는 `SPRING_APPLICATION_JSON` 주입 |
| dev         | career.dev.bconnect.to / plan.dev.bconnect.to                                                         | api.dev.bconnect.to (Railway)                                                               | dev 브랜치 머지 후에만 최신. 실 데이터·실 SMS                |
| prod        | career.bconnect.to / plan.bconnect.to                                                                 | api.bconnect.to                                                                             | **read-only. write 시나리오는 사전 승인 필수**               |

### 조합별 함정

- **FE local + BE dev = 금지에 준함**: cross-site라 httpOnly refreshToken 쿠키 미전송 → 풀 네비 시 세션 끊김. dev BE 상대 QA는 배포된 dev 사이트(same-site)로.
- **BE mock(MSW)**: 실 BE 에러를 은폐한 전력 다수 (403 마스킹, 스펙 drift). 4xx 시나리오는 mock 핸들러 조작 재현일 뿐 실계약 검증 아님 — 보고서에 명시.
- **local(be)**: S3/CloudFront 자격 더미 → presign→S3 PUT 실패, 시드 이미지 URL 깨짐. 파일 업로드 완주·이미지 표시는 dev 이상에서만.
- **로컬 다중 포트 쿠키 공유**: 쿠키는 host(localhost) 스코프 — 포트 달라도 auth_hint·refresh 쿠키 공유됨. 다른 세션 잔존 쿠키가 새어들 수 있음 → **chrome-devtools `isolatedContext`로 격리** (크로스 계정 QA도 동일).
- `NEXT_PUBLIC_*`는 기동 시 인라인 → `.env.local` 변경 후 dev 서버 재시작 필요. ⚠️ 워크트리의 `.env.local`은 다른 워크트리로의 symlink일 수 있음 — 원본 오염 금지, QA 후 원복.
- agentation dev toolbar(:4747) health 폴링이 네트워크를 계속 잡아 `navigate_page` 타임아웃 잦음. 페이지는 로드됨 — 무시하고 진행.

## 서버 소유권

서버 기동·식별·중지는 [local-servers 스킬](../../local-servers/SKILL.md) 규칙을 따른다. 사용자가 이미 띄운 서버는 절대 재기동/종료하지 않는다 (navigate만). 종료가 필요하면 포트 기반(`fuser -k <port>/tcp`)만 — `pgrep -f` 금지. build/lint/typecheck 실행은 자유.

## 로그인 레시피

전화 OTP 2-step.

- **local(mock)**: 전화번호 `01099` prefix = 기존 회원, OTP `123456` 고정. 실발송 0.
- **local(be)**: `LoggingSmsProvider`가 BE 로그에 코드 출력 — `grep "SMS to <전화번호>" | tail -1` → `인증번호 [XXXXXX]`.
  시드 계정 (data.sql, H2 재부팅 시 리셋):
  - career(기술자): `01000000002` — member 100 'test'
  - plan(업체): `01000000200` — member 200 '샘플업체' → company 200 → 샘플 프로젝트
  - 시드 id 규칙: 운영 0-99 / 테스트 100-199 / 샘플 200-299. 신규 생성 id는 1000+
- **dev/prod**: 실 SMS. **테스트 번호는 각자 본인 명의 번호만** — 타인 번호 금지. 제약: 일일 10회 + 60s 쿨다운, **5회 실패 시 attempts 락아웃** (재전송해도 같은 401 = 락아웃 확정 → 재발급으로 attempts 리셋). 로그인 횟수 최소화하도록 케이스 순서 설계 (세션 재사용 우선).

## 계약 (contract)

- 모든 API 응답 envelope `{ success, data/error }`. customFetch가 자동 unwrap — 네트워크 탭 raw 응답에는 envelope 존재해야 함. 없으면 계약 위반.
- generated client: `packages/api-client/src/generated/` (orval, gitignored — fresh 워크트리는 typecheck 전 `pnpm api:generate` 선행).
- 검증 스키마: zod. `@bconnect/config/*` 유틸(phone, address 등)이 형식 SSOT.
- 하드 네비 직후 병렬 요청 401×N → single-flight refresh 후 일괄 재시도 200 — 설계 동작, 콘솔 401 소음은 버그 아님.
- 파일 업로드 2-phase: `POST /attachments/presign {context,type,contextId,files[]}` → S3 PUT → confirm → 컨텍스트 바인딩.

## 브라우저 드라이브 레시피

- 네이티브 date input: `fill` 안 먹음 → `evaluate_script`로 React setter 주입 (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set` + input event dispatch).
- portal 기반 listbox 옵션: `evaluate_script`로 `.click()`.
- **토스트 검증은 MutationObserver**: radix toast가 wait_for/textContent 폴링에 안 잡히는 경우 있음. viewport(`[role="region"]`)에 observer 심고 트리거 → 기록 회수.
- `upload_file`은 "파일 선택기 여는 요소" uid에 직접 사용 가능. change 이벤트 디스패치가 간헐 플레이크 — 미반응 시 재시도.
- 브라우저 권한(Notification 등): chrome-devtools MCP에 권한 제어 없음 → playwright MCP `browser_run_code_unsafe`로 `grantPermissions`/`clearPermissions`. 단 playwright chromium은 백그라운드 Web Push 수신 불가 — 인앱 수신만 검증 가능.
- write 후 네비로 네트워크 리스트 리셋 → `list_network_requests({includePreservedRequests:true})`.
- 알림 권한 다이얼로그("알림을 켜시겠어요?")가 로그인 직후 뜸 → "나중에" 클릭.
- plan 케밥 = MenuButton(menu role), career 케밥 = ActionDrawer(dialog) — 스냅샷 구조 다름.
- 원클릭 조회 해피패스는 유효 사업자번호+대표자+개업일 실조합 필요(NTS 진위확인) → 임의 checksum 번호로는 실패만 재현 가능, 생성 해피는 BLOCKED.

## 스크린샷 저장 위치

`<워크트리>/.tmp/screenshots/` (gitignored). repo root 저장 금지. 보고서 임베드 후 정리.
JPEG 다운스케일: `ffmpeg -i in.png -vf "scale=720:-2" -q:v 6 out.jpg`

## 이슈 컨벤션

- 팀 레포 = 외부 소통. 제목 `type(scope): 설명`, 본문 쉬운 한국어, **초안 → 사용자 승인 → 생성**.
- 템플릿: Bug Report(재현/예상/실제) / Task. 레이블은 `gh label list` 실측 우선, 담당자 매핑은 [team.md](../../../../docs/reference/team.md) — 담당자·리뷰어 임의 지정 금지.
- 본문 생성은 `gh issue create --body-file` (inline HEREDOC 금지). 본문 파일 참조는 절대 blob URL.

## known-issues (스위프 노이즈 억제)

<!-- 실행마다 갱신. 형식: - 증상 — 원인/이슈번호. 픽스 확인되면 ~~취소선~~ + 실측 날짜 -->

- cursor 파라미터 `[object Object]` 직렬화 — 기존 이슈 #759.
- 비로그인 `POST /monitoring` 307→login→405 (Sentry tunnel 가드 차단) — 이슈 #831.
- 채팅 unread 영구 잔존 — 읽음 API 스펙 부재, 이슈 #839.
- `GET /companies/me [404]` = 회사 미등록 회원의 정상 empty-state 계약. 404라고 버그 아님.
- 풀 네비 첫 API 401 → refresh → 재시도 200 콘솔 에러 1건 — 정상 복구 플로우 노이즈.
- agentation :4747 폴링으로 인한 navigate_page 타임아웃 — 도구 노이즈, 버그 아님.
- 인증 신청 자세히보기·발급받기 링크 일부 미배선 — 이슈 #950.
- plan 기술자 카드 평점·리뷰/계약 수 하드코딩 — 이슈 #832.
- 파일 인증 업로드 presign 200인데 S3 PUT `net::ERR_FAILED` = S3 CORS origins 누락 지문 (#949에서 픽스, 재발 시 인프라 확인).
