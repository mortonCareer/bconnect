# ADR-0020: 듀얼셸 뷰 공유 — renderShell 주입 + 데이터 위로 올리기 + 앱별 어댑터

- **Status**: Proposed
- **Date**: 2026-06-07
- **Deciders**: @manamana32321
- **Related**: [ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md) (공유 feature 패키지 도입 — 본 ADR이 일반화) · [ADR-0015](./0015-be-code-as-api-ssot.md) (SSOT) · 대상 통합 [#541](https://github.com/mortonCareer/bconnect/issues/541) · renderShell 선례 [#537](https://github.com/mortonCareer/bconnect/issues/537)

## Context

[ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md)에서 `@bconnect/features`를 만들어 "같은 화면을 plan 패널과 career 풀페이지가 한 구현으로 공유"하기로 정했다. 그러나 실제로는 **plan만 공유 뷰를 소비하고 career는 전 화면을 인라인 재구현**한 상태로 굳었다(전수조사: career는 `@bconnect/features`를 단 한 곳도 import하지 않음).

근본 원인 둘:

1. **셸 하드와이어** — `ProfileView`/`ChatView`가 `PanelShell`(고정 드로어 좌표계 + Esc 닫기 + 우측 화살표)을 내부에 박아둠. career 풀페이지(TopBar + 하단 네비)는 이 셸을 못 쓴다.
2. **fetch 그래프 발산** — 뷰가 `useGetProfile(id)`(by-id)로 **자기 데이터를 직접 가져온다**. 그런데 본인 화면(career owner)은 by-id로 자기를 못 본다: by-id 응답의 `member`는 **마스킹**되고, 본인용 `useGetMyMember`만 **마스킹 안 된 전체** member를 준다. 추천서도 owner는 `useGetMy*Recommendations`, 타인은 by-id로 갈린다.

여기에 결정적 제약이 더해진다: **로그인/회원가입을 뺀 career 화면의 ~90%가 결국 plan 우측 패널에도 들어간다**. 즉 `@bconnect/features`는 곧 제품 거의 전체 뷰의 SSOT가 되며, 지금 정하는 패턴이 **수십 개 뷰 마이그레이션의 템플릿**이 된다. 한 번의 결정이 ×30으로 갚아진다.

[#537](https://github.com/mortonCareer/bconnect/issues/537)이 `ChatView`에 **renderShell 주입**(셸을 앱이 함수로 넘김)을 도입해 셸 축 하나는 풀었다. 남은 문제는 정책/데이터 축이다.

## Options

### Option A: 주입 슬롯 + 데이터 위로 올리기 + 앱별 어댑터

`features` 뷰 = 순수 표현 계층. 데이터는 앱이 가져와 prop으로 내려주고(`data: ProfileViewData`), 셸·액션버튼·편집링크는 앱이 주입(`renderShell`/`actionSlot`/`editHrefs`). mutation(동료추가/메시지)·Web Share·`useGetMy*` 훅은 전부 앱측. 각 앱은 얇은 **어댑터 컴포넌트** 하나로 훅·mutation을 모은다.

- **장점**: 공유 패키지가 표현 계층으로 순수 유지 → plan 번들에 career 전용 mutation 유입 0. 셸/정책 주입은 #537 철학의 직선 연장. 마스킹 발산을 앱 어댑터가 올바른 훅으로 해소. 새 소비처(예: admin)도 슬롯 조합으로 자유.
- **단점**: 앱 페이지에 액션 JSX·fetch 배선이 남음(어댑터로 한 번 묶어 완화). prop이 늘어 시그니처가 다소 길다.

### Option B: 뷰 안에 mode 분기 내장(fold)

`ProfileView`에 `mode: 'owner' | 'viewer'`를 두고, 내부에서 `useGetMy*` vs by-id 훅을 런타임 분기하고 편집/공유/동료추가/메시지 버튼과 mutation까지 자체 렌더.

- **장점**: career 페이지가 거의 원라이너. 데이터 분기가 한 곳에 모임.
- **단점**: plan도 소비하는 공유 패키지가 plan이 **절대 실행 안 하는** mutation·Web Share를 떠안음. `mode` 런타임 분기라 **정적 제거(tree-shake) 불가** → plan 번들이 데드코드를 뷰마다 영구 적재(×30). 공유 패키지가 두 앱의 훅 어휘에 결합 → SSOT 경계 침범. plan이 나중에 자기 액션(예: 제안 보내기)을 더하려면 공유 패키지를 고쳐야 함.

## Decision

**Option A 채택. B 기각.** (4렌즈 독립 설계 패널 — 번들/SSOT·DX/규모·plan정합·선례진화 — 만장일치 수렴.)

핵심은 **두 축을 분리**하고 각 축을 주입으로 푸는 것:

```
       셸 축 (어디에 그리나)                정책 축 (누가 보나)
       ───────────────────                ──────────────────
career ─ 풀페이지(TopBar+하단네비)     owner ─ 자기(전체 member, 편집/공유)
plan   ─ @panel 드로어(PanelShell)     viewer ─ 남(마스킹, 동료추가/메시지)

   renderShell 주입으로 해결            actionSlot+editHrefs 주입 + 어댑터 fetch
   (career=함수 줌, plan=생략)          (career owner/viewer 어댑터, plan=슬롯 생략)
```

B의 유일한 실익(career 원라이너)은 "공유층이 앱 정책을 흡수"라는 영구 비용 대비 약하다. 단, B가 잘하는 부분 — **셸 fold**(#537 union)와 **결정된 데이터 전달** — 은 비용이 없으므로 그대로 중앙화한다. mutation/정책만 앱으로 민다.

### 데이터 흐름 (트리)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  packages/features  (순수 표현 — fetch·mutation·My*훅 0)                       │
│                                                                               │
│   <ProfileView>                                                               │
│     ├─ profileId                                                              │
│     ├─ data: ProfileViewData          ◄── resolved (앱이 fetch해 내려줌)       │
│     ├─ 셸 union (renderShell │ closeHref+onClose)   ◄ #537 그대로 동결         │
│     ├─ actionSlot?    (없으면 액션 row 안 그림)                                │
│     ├─ editHrefs?     (없으면 편집링크 안 그림)                                │
│     ├─ statHrefs?     (없으면 stat 비링크)                                     │
│     ├─ workEditHref?  (없으면 3점 메뉴 안 그림)                                │
│     │                                                                         │
│     └─ 렌더:                                                                  │
│         <ProfileSummary data + statHrefs?/>                                    │
│         {actionSlot}                  ◄── 앱이 주입한 버튼 여기                │
│         <Tab/> ├─ <IntroTab data + editHrefs?/> → <RecommendationList data/>   │
│               └─ <WorksTab workEditHref?/>      → <WorkCard/>(feeds는 self)    │
│         셸 = renderShell ? renderShell({title,children}) : <PanelShell>        │
└───────────────────────────────────────────────────────────────────────────────┘
          ▲                       ▲                          ▲
          │ data + 슬롯 주입       │ data + 슬롯 주입          │ data만, 슬롯 0
┌─────────┴──────────┐ ┌──────────┴─────────┐  ┌──────────────┴──────────────┐
│ career OwnerView   │ │ career ViewerView  │  │ plan ProfilePanelPage       │
│ (어댑터가 정책 소유)│ │ (어댑터가 정책 소유) │  │                             │
│ fetch:             │ │ fetch:             │  │ fetch:                      │
│  useGetMyProfile   │ │  useGetProfile(id) │  │  useGetProfile(id)          │
│  useGetMyMember ◄┐ │ │  useGet…({pid})    │  │  useGet…({pid}) (by-id)     │
│  useGetMy*Recos  │ │ │  useGet*Recos      │  │                             │
│  (전체 member)───┘ │ │  (by-id, 마스킹)    │  │  (by-id, 마스킹)            │
│ 슬롯:               │ │ 슬롯:               │  │ 슬롯: 없음 ✗                │
│  actionSlot=       │ │  actionSlot=       │  │  → 읽기전용 자동             │
│   [프로필수정][공유]│ │   [동료추가][메시지]│  │                             │
│  editHrefs ✓       │ │  mutation:         │  │ plan 번들:                  │
│  statHrefs ✓       │ │   CreateCoworker   │  │  career mutation 0 ✓        │
│  workEditHref ✓    │ │   CreateDirectChat │  │  Web Share 0 ✓              │
│  renderShell ✓     │ │  renderShell ✓     │  │  My*훅 0 ✓ (tree-shake)     │
└────────────────────┘ └────────────────────┘  └─────────────────────────────┘
   /profile (owner)       /profile/[memberId]      plan @panel 드로어
```

### 디렉토리 배치 (현재 → 목표)

```
packages/features/src/profile/
  ProfileView.tsx          ▲ 셸 union(#537) + data prop + 슬롯/href. self-fetch 제거
  ProfileSummary.tsx       ▲ statHrefs? 추가 (있으면 stat을 Link로)
  IntroTab.tsx             ▲ credentials·추천서 self-fetch 제거 → data prop, editHrefs?
  RecommendationList.tsx   ▲ received/sent self-fetch 제거 → data prop (받은/보낸 토글 유지)
  WorksTab.tsx             ▲ workEditHref? 추가 (feeds는 by-id라 self-fetch 유지)
  WorkCard.tsx             ▲ company/duration/3점메뉴를 optional prop으로 흡수
  index.ts                 ▲ ProfileView + ProfileViewProps + ProfileViewData export

apps/career/src/app/(main)/profile/
  _adapters/
    CareerProfileView.tsx  ＋신규: careerShell 팩토리 + useShareCurrentUrl
                                  + OwnerProfileView(My*훅+편집/공유)
                                  + ViewerProfileView(by-id+동료/메시지 mutation)
  page.tsx                 ▽ <OwnerProfileView/> 얇은 래퍼로 축소
  [memberId]/page.tsx      ▽ <ViewerProfileView memberId/> 얇은 래퍼로 축소
  recommendations/page.tsx ▽ RecommendationList 소비로 교체 (3번째 인라인본 제거)
  _components/
    ProfileHeader.tsx      ✗ 삭제 (parity 검증 후) → ProfileSummary
    IntroSection.tsx       ✗ 삭제 → IntroTab + RecommendationList
    WorksSection.tsx       ✗ 삭제 → WorksTab
    WorkCard.tsx           ✗ 삭제 → features WorkCard

apps/plan/src/app/(main)/@panel/profile/[profileId]/
  page.tsx                 ▲ by-id data를 page에서 resolve해 내려줌. 셸 슬롯 생략(기본 PanelShell)
                             동작 불변 — career mutation/Web Share/My*훅 import 0
```

(`certifications/`, `coworkers/`, `edit/` 하위는 본 통합 범위 밖 — 그대로 둠.)

### 나머지 ~29개 뷰가 따라 할 4단계 레시피

1. **셸**: `ChatView`/`ProfileView`의 renderShell union을 그대로 복사. career는 한 번 정의한 `careerShell(onBack?)`을 넘기고, plan은 생략(기본 PanelShell). union 모양은 재유도 금지 — 동결.
2. **데이터**: resolved prop 인터페이스(`<Feature>Data`)를 정의. 앱/모드별로 갈리는 훅(My\* vs by-id)은 **앱 어댑터가 무조건 호출**해 prop으로 내림. 뷰는 절대 self-fetch 안 함 → 이게 패키지를 공유 가능·번들 청결로 유지하는 규칙. (페이지네이션/무한스크롤처럼 발산 없고 끌어올리기 어려운 by-id 데이터는 예외적으로 뷰 self-fetch 허용 — 예: feeds.)
3. **정책**: optional 슬롯/href 노출(`actionSlot`/`editHrefs`/`statHrefs`/…). prop 부재 ⇒ 그 어포던스 안 그림 ⇒ plan/viewer가 읽기전용 표면을 공짜로 얻음(하위호환).
4. **어댑터**: 각 소비 앱이 뷰당 얇은 어댑터 컴포넌트 하나로 훅/mutation/Web Share를 배선. mutation·Web Share는 앱에 살고 패키지엔 절대 안 들어감.

## Consequences

- **좋음**: plan 번들이 career 정책 코드와 영구 분리(tree-shake 가능). 공유 패키지가 표현 계층으로 순수 유지 → 90% 마이그레이션에서 결합이 뷰 수에 비례해 쌓이지 않음. 마스킹 발산이 올바른 훅 호출로 해소(owner 전체 member). 통합이 곧 버그 수정(추천서 더보기·발신자 마스킹·로딩 스켈레톤·next/image)을 동반.
- **나쁨**: 앱 페이지에 액션 JSX·fetch 배선 잔존(어댑터로 완화하나 0은 아님). prop 시그니처가 길어짐. 셸/데이터 끌어올리기로 plan `@panel/profile` page도 손대야 함(동작 불변이지만 변경 표면 존재).
- **중립**: 훅을 prop으로 주입하는 방식은 명시적으로 배제(조건부/가변 훅 호출 = React 규칙 위반 위험). 데이터는 항상 호출된 결과를 내려준다.

## Notes

- 후속: 이 패턴을 `packages/features/README`에 4단계 레시피로 박아 팀이 기계적으로 복제하게 함.
- 검증 게이트: career owner/viewer를 Figma 1:1로 맞추고(mock 로그인) **인라인 4파일은 parity 확인 후에만 삭제**. typecheck(career+plan)·lint·`pnpm build:plan`·plan 번들에 `useCreateCoworkerRequest`/`useCreateDirectChat`/`navigator.share` 미유입 확인.
- 메시지 스트림(`MessagesView`/`ChatView`/`MessageThread`)도 같은 패턴으로 별도 진행([#541](https://github.com/mortonCareer/bconnect/issues/541) 하위작업 2).
