# API 연결 작업 (feat/api-connect) — 핸드오프

> 전환기 조율 문서. `feat/api-connect` → dev 머지 전 삭제.

## TL;DR

BE-SSOT flip으로 orval 생성 클라이언트의 훅·타입 이름/형태가 바뀌었다. dev의 FE 소비부(~20파일)가 아직 옛 심볼을 참조해 **typecheck가 red**다. 이 작업 = **FE를 새 생성 클라이언트에 도메인별로 정합해 green 회복**. 손장수·김예진이 `feat/api-connect` **한 브랜치에서 공동 작업**.

## 배경 / 상황

- **#690 (머지됨)**: 손-작성 OpenAPI spec 폐기. BE springdoc이 emit한 spec을 orval이 becompat transformer로 정렬해 직접 소비. operationId·스키마·필드명이 규칙 기반으로 바뀜 (예: `useGetMyProfile`(GET /profiles/me)은 BE에 없어 사라짐, `Chat`→`DirectChat`/`GroupChat` 분리, `createTask`→worker/company 분리).
- **#728 (머지됨, #745)**: 캐시 무효화를 orval `mutationInvalidates` config SSOT로. mutation 훅이 `onSuccess`에 `invalidateQueries` 자동 주입. 도메인 정합 시 각 호출부의 **수동 `invalidateQueries` 제거** 병행.
- **현재 dev**: flip + 캐시 인프라는 안착했으나 FE 소비부 미정합 → CI red (대형 전환기, 팀이 감수하고 진행 중). 우리가 green 회복하는 게 이 작업.

## 브랜치 & 협업 규칙 (중요)

- 브랜치: **`feat/api-connect`** (origin/dev 기준). 워크트리 `~/morton-worktrees/api-connect`.
- 합류: `git fetch && git checkout feat/api-connect && pnpm install`
- **한 브랜치 공동작업** → 충돌 방지:
  - 작은 단위로 자주 커밋
  - **push 전 반드시 `git pull --rebase origin feat/api-connect`** 후 진행
  - 같은 파일 동시 편집 피하게 **도메인 단위로 분담** (아래)
- 완료 시 `feat/api-connect` → dev PR (green 되면).

## 할 일 = 도메인별 정합 (dev의 팬텀 참조 파일)

| 도메인             | 파일                                                                                        | 핵심                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **messages/chat**  | ChatView·MessagesView·MessageThread·PanelChat·PanelMessages·CareerMessagesView              | `useGetMyChats`/`useGetChat` → `useGetDirectChats` + `useGetGroupChats` 분기 (최대 덩어리)               |
| **tasks/calendar** | TaskDetailCard·useMonthTasks·TaskCreateForm                                                 | `useCreateTask`/`useUpdateTask`/`useGetMyTasks` → worker/company/assignee 분리 · `useGetTasks`           |
| **profile**        | CareerProfileView·ProfileView·CoworkerList·RecommendationList·coworkers·certifications·edit | `useGetMyProfile` → `useGetMyMember` + `useGetProfile(id)` · `MaskedMember`/`ProfileAndMember` 타입 교체 |
| **home**           | page.tsx                                                                                    | 피드 등                                                                                                  |
| **notifications**  | plan MemberSidebar                                                                          | `useGetMyNotifications` — BE #686 머지 대기 (임시 처리/스텁)                                             |

## 팬텀 해소 3버킷 (판단 기준)

1. **FE 정합** (BE가 의도적으로 다르게 설계): chat 분리·task 분리 → FE를 분리 엔드포인트로.
2. **rename** (엔드포인트 존재, 이름만): `getMyTasks` → `getTasks`(auth 필터).
3. **BE 대기** (곧 생김): `getMyProfile`(BE 구현 예정)·`getMyNotifications`(#686). 임시 우회/스텁.

⚠️ 없는 엔드포인트를 supplement로 억지 주입 금지 — 실 BE 404 + drift. supplement는 "BE엔 있는데 springdoc이 못 보는"(verify/refresh) 것만.

## 갭 종류 (typecheck 에러 → 대응)

- **개명**: `getGetMyProfileMockHandler` → `getGetProfile…` 등 호출부 이름 교체
- **shape**: `Profile.profile` 없음, `ProfileSummary.id` 없음 → 구조 재매핑
- **nullability**: `null` not assignable to `string | undefined` → mock값 `undefined` (근본 해소는 BE `required` emit, CEO)
- **수동 무효화 제거**: mutationInvalidates 인계된 도메인은 호출부 `invalidateQueries` 삭제 (ADR-0025)

## mock 오버라이드 (`packages/mocks/src/overrides/`) — 최후순위

- 오버라이드도 생성 클라이언트의 **별도 소비자** → typecheck 그래프에 있어 merge 게이트. 앱 고쳐도 자동 정합 안 됨.
- **대부분 fix** (큐레이션 데이터 유지). **삭제**는 phantom 엔드포인트(`devices`·`notifications`)만.
- 런타임은 모킹 끄고(`NEXT_PUBLIC_API_MOCKING=disabled`) dev BE로 개발 가능하나, typecheck/build는 flag 무관하게 오버라이드 컴파일 → 결국 정합 필수.

## 검증

```bash
pnpm api:generate                        # 생성 클라이언트 재확인
pnpm --filter morton-career typecheck    # 도메인 정합 → 에러 감소 확인
pnpm --filter morton-plan typecheck
pnpm build:career && pnpm build:plan     # merge 전 최종
```

## 규칙

- **BE(`apps/api`)는 건드리지 않음** — 규칙 출력에 FE 호출부를 맞춘다 (억지 예외 X).
- 훅 이름 규칙·예외는 `packages/api-client/CLAUDE.md` (operationId 규칙 + OPID_SPECIAL, 코드 검증 완료).
- 이름 헷갈리면 tsc 에러의 "Did you mean …?" 제안 활용.

## 참조

- **Notion「API 대응 Hook」** `https://app.notion.com/p/391965d2888b80d1a0e3e3308814c060` — 83행 엔드포인트↔훅 전체표 + Step2 정합상태별 보드(Phantom 칼럼 = 우선순위). 입력/응답 타입, BE구현상태, 도메인 필터.
- `packages/api-client/CLAUDE.md` — 파이프라인·transformer 규칙
- ADR-0024 (flip), ADR-0025 (캐시 무효화)

---

## 진행 상황 (2026-07-07)

### 완료됨

- **임시 호환 레이어 파일 추가** `packages/api-client/src/_temp-compat.ts` — 개발 서버를 오류 없이 띄우기 위한 임시 우회 매핑을 추가한 파일, 자세한 내용은 해당 파일 상단 주석에 설명해둠
- **연결 완료(실서버 검증)**: `/profile/[memberId]/recommendations`페이지 연결 완료함. (`recommendations` 는 public 이면서 seed 데이터 확보된 상태라 우선 연결 후 QA까지 완료함)

### 계획

- **다음에 연결할 페이지 (데이터 의존성 기준으로 계획)**:
  1. **public + seed 대기** → 연결은 바로 가능, seed 오면 즉시 QA(로그인 무관).
     · **`/profile/[memberId]` 프로필 본체** (정체성 원천 — 하위가 member/Profile shape·pid 물려받음) → 최우선
     · `/` 홈 피드 (posts seed 후 — getFeeds public·author 정보 응답 내장이라 얽힘 적음)
  2. **인증 필요** → 연결은 바로 가능, **dev 로그인(otp) 확보 후 일괄로** QA.
     · 동료·캘린더·메시지·본인 화면(`/profile`·`edit`·`settings`) 등

### 참고

- **도메인 의존 현황 (otp·member·profile)**:
  - `member`(memberId) — 거의 전 도메인이 조회 키로 참조하나 **seed에 이미 있어 조회는 지금도 가능**.
  - `profile` — flip으로 의존 축소(조회가 memberId로 이동, profileId는 coworker/offer write 정도만).
  - `otp`(로그인) — **auth 도메인 전체(chat·task·coworker·notification·offer·내 것)를 여는 게이트.** 실서버 QA를 넓게 여는 열쇠.
