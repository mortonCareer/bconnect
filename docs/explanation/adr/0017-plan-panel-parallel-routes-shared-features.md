# ADR-0017: plan 우측 패널 — parallel route slot + 공유 feature 패키지

- **Status**: Accepted
- **Date**: 2026-06-01
- **Deciders**: @manamana32321
- **Related**: [ADR-0012](./0012-design-system-ssot-figma.md) · [ADR-0014](./0014-design-system-tokens-krds-tailwind.md) (패키지 레이어링 맥락) · 대상 패널 [#344](https://github.com/mortonCareer/bconnect/issues/344) [#345](https://github.com/mortonCareer/bconnect/issues/345) [#347](https://github.com/mortonCareer/bconnect/issues/347)

## Context

plan(업체 웹앱)의 기술자 탐색 화면은 우측에 393폭 패널을 띄운다 — 프로필 상세([#344](https://github.com/mortonCareer/bconnect/issues/344)), 메시지 목록/대화([#345](https://github.com/mortonCareer/bconnect/issues/345)), 알림([#347](https://github.com/mortonCareer/bconnect/issues/347)). 이 패널은 plan UX의 핵심이며 다음 성질을 가진다:

- **자체 내부 네비게이션**: 메시지 목록 → 대화 진입처럼 패널 안에서 더 깊이 이동한다.
- **배경 유지**: 패널은 탐색 리스트 위에 얹히고, 리스트는 살아있다.
- **닫기 가능**.
- **독립 full page 불필요**: 패널 콘텐츠가 별도 전체 페이지로 열릴 필요는 없다.

같은 경험(프로필/메시지/대화)은 career(기술자 PWA)에 이미 풀 페이지로 존재한다(`/profile/[id]`, `/messages`, `/messages/[chatId]`). 같은 화면을 두 번 만들고 싶지 않다.

**제약**: plan·career는 **별도 빌드·배포되는 두 Next 앱**이다(`plan.bconnect.to` / `bconnect.to`). 한 앱이 다른 앱 페이지를 in-process로 가져올 수 없다 — 공유 라우트 트리가 없고 intercepting route도 앱 경계를 못 넘는다. 현재 앱 간 공유는 `@bconnect/ui` 중간 컴포넌트(`ChatListItem` 등)·`@bconnect/api-client`·`@bconnect/config`뿐, 풀 feature view 공유 패키지는 없다.

결정은 두 축으로 나뉜다: **(1) 패널 구조/주소화**, **(2) feature UI 공유 방식**.

## Options

### 축 1 — 패널 구조

#### Option A: client state + nuqs(shallow) + `<Sheet>`

- **장점**: 최소 코드, Next 라우팅 기능 불필요.
- **단점**: 브라우저 back/forward가 패널 네비(닫기·목록↔대화)를 못 움직임. 새로고침 시 패널 소실. 내부 네비 스택을 직접 구현·관리.

#### Option B: parallel slot `@panel` + intercepting routes

- **장점**: 완전한 URL 라우팅, 중첩 네비 native, full page 폴백.
- **단점**: intercepting의 목적이 "모달=full page 양립"인데 우리는 full page가 불필요. 게다가 intercepting은 하드 로드 시 **하위 full route를 반드시 렌더** → 원치 않는 full page 변종을 강제. 요구사항과 충돌.

#### Option C (선택): parallel slot `@panel`, intercepting 없음, `default.tsx`로 닫힘

`(main)` 레이아웃이 `children`(좌: 리스트)과 `@panel`(우: 패널)을 함께 렌더. 내부 네비 = `@panel` 하위 중첩 segment. 닫힘 = `@panel/default.tsx`(null). 배경 유지 = `(main)/default.tsx`가 리스트 렌더.

- **장점**: path URL + 중첩 네비 native + back/forward·새로고침이 패널 네비를 그대로 움직임. **full page 변종 안 생김**(어느 URL이든 "리스트+패널" 한 형태). 닫기/뒤로가기가 web 기본 동작으로 공짜.
- **단점**: parallel routes 학습 곡선. `default.tsx` 누락 시 "슬롯 마지막 상태 잔존" 함정 주의.

### 축 2 — feature 재사용

분리 앱이라 career 페이지를 가져올 수 없다 → 사실상 **공유 패키지 추출 vs 앱별 중복**뿐. 중복은 DRY 위반 + 두 앱 화면 divergence 비용이 커 기각.

## Decision

**Option C + 공유 feature 패키지 `@bconnect/features`.**

- plan `(main)`에 `@panel` parallel slot 도입. 내부 네비는 슬롯 하위 중첩 라우트, 닫힘은 `default.tsx`. intercepting route 미사용(full page 불필요).
- 패널 알맹이는 신규 `@bconnect/features`의 client feature view(`ProfileView`·`MessagesView`·`ChatView`·`NotificationsView`). 데이터는 `@bconnect/api-client` 훅으로 — 양쪽 앱이 동일하게 마운트.
- career도 자기 라우트에서 같은 view 마운트(`/messages` → `<MessagesView/>`). 구현은 하나.

레이어링: `@bconnect/ui`(표현 전용) ← `@bconnect/features`(ui 조합 + 데이터/로직) ← 앱(라우팅·셸). `ui`는 데이터를 품지 않는 계약([ADR-0012](./0012-design-system-ssot-figma.md)) 유지 → feature view는 `ui`에 넣지 않고 별도 패키지.

우선시한 force: 패널의 web 네비 시맨틱을 프레임워크에 위임 + 두 앱 화면 SSOT 단일화. 받아들인 트레이드오프: parallel routes 도입 비용 + career 페이지 client feature 분리 리팩터.

## Consequences

- **좋은 결과**: 닫기·내부 네비·뒤로가기·새로고침이 브라우저 기본 동작; 프로필/메시지/대화가 두 앱 단일 구현(한 곳 고치면 양쪽); intercepting 미사용으로 라우팅 단순.
- **나쁜 결과**: parallel routes는 팀에 새 패턴(`default.tsx` 규칙 숙지 필요); career 페이지를 `@bconnect/features` 마운트로 바꾸는 리팩터 비용(점진); feature view가 client라 해당 화면 RSC 서버렌더 이점 일부 포기.
- **중립적 결과**: plan 로그인 게이트 모달(`LoginPromptModal`)은 별개 관심사라 현행 React-state 유지(본 ADR 범위 밖); 알림([#347](https://github.com/mortonCareer/bconnect/issues/347))은 career·BE에도 없어 `NotificationsView`는 net-new + notification 도메인 BE 종속.

## Notes

- 롤아웃: (1) `@bconnect/features` scaffold → (2) plan `@panel` 골격 + `default.tsx` → (3) feature view 추출/구축하며 [#344](https://github.com/mortonCareer/bconnect/issues/344)/[#345](https://github.com/mortonCareer/bconnect/issues/345)/[#347](https://github.com/mortonCareer/bconnect/issues/347) 구현 → (4) career 페이지 점진 이관.
- "닫기" = base 경로로 navigate(`@panel`이 `default.tsx`로). `default.tsx` 누락 시 slot이 이전 상태를 유지하는 Next 동작에 주의.
- 패키지가 커지면 도메인별(`@bconnect/profile` 등) 분리 가능하나, 현재 3~4 feature 규모는 단일 `@bconnect/features`로 시작.
