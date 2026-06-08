# ADR-0020: 한 화면을 두 앱이 공유하는 법 — 껍데기는 앱이 끼우고, 데이터는 앱이 내려준다

- **Status**: Proposed
- **Date**: 2026-06-07
- **Deciders**: @manamana32321
- **Related**: [ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md) (공유 화면 패키지를 처음 만든 결정 — 이 글이 그걸 더 일반화) · [ADR-0015](./0015-be-code-as-api-ssot.md) · 대상 작업 [#541](https://github.com/mortonCareer/bconnect/issues/541) · 앞선 사례 [#537](https://github.com/mortonCareer/bconnect/issues/537)

## Context (왜 이 결정이 필요했나)

우리는 같은 화면(프로필·메시지 등)을 두 앱에서 쓴다.

- **career**(기술자 앱): 화면 전체를 차지하는 풀페이지로 보여준다 (위에 TopBar, 아래에 탭 메뉴).
- **plan**(업체 앱): 오른쪽에서 슬라이드로 나오는 패널 안에 같은 화면을 보여준다.

[ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md)에서 "같은 화면을 두 번 만들지 말고 `@bconnect/features` 패키지에 한 번만 만들어 둘이 같이 쓰자"고 정했다. 그런데 실제로는 **plan만 그 공용 화면을 쓰고, career는 똑같은 화면을 자기 폴더에 처음부터 다시 만들어 쓰는** 상태로 굳어 있었다 (전수조사 결과 career는 `@bconnect/features`를 한 번도 불러 쓰지 않았다).

왜 career가 공용 화면을 못 썼나? 두 가지 걸림돌이 있었다.

1. **껍데기가 화면에 박혀 있었다.** 공용 `ProfileView`는 plan의 패널 껍데기(`PanelShell` — 패널 위치 좌표, Esc로 닫기, 오른쪽 화살표 닫기 버튼)를 자기 안에 통째로 박아 두었다. career의 풀페이지(TopBar + 아래 탭)는 이 패널 껍데기를 쓸 수가 없다.

2. **데이터를 어디서 가져오는지가 화면마다 다르다.** 공용 화면은 `useGetProfile(id)`로 **자기가 직접** 데이터를 가져왔다. 그런데 "내 프로필"(career 본인 화면)은 이 방식으로는 내 정보를 제대로 못 가져온다. id로 남의 프로필을 볼 때 오는 `member` 정보는 **개인정보가 일부 가려진(masked)** 버전이고, 내 정보 전체는 `useGetMyMember` 같은 "나" 전용 호출로만 온다. 추천서도 마찬가지로 "내 것"은 `useGetMy*`, "남의 것"은 id로 가져오는 호출이 다르다.

여기에 큰 제약이 하나 더 붙는다: **로그인·회원가입을 뺀 career 화면의 약 90%가 결국 plan 패널에도 들어간다.** 즉 `@bconnect/features`는 곧 제품 화면 거의 전부의 원본 저장소가 된다. 지금 정하는 방식이 **앞으로 수십 개 화면을 옮길 때 따라 할 본보기**가 된다. 한 번의 선택이 30번 곱해진다.

[#537](https://github.com/mortonCareer/bconnect/issues/537)에서 `ChatView`에 이미 **"껍데기를 앱이 함수로 끼워넣는"** 방식을 도입해 1번 걸림돌(껍데기)은 풀어 두었다. 남은 건 2번(데이터를 어디서 가져오나)과, 버튼·편집 링크 같은 "내 화면에만 있는 기능"을 어떻게 붙이느냐다.

## Options (두 갈래)

### A안: 빈자리(슬롯)를 앱이 채우고, 데이터는 앱이 내려준다

공용 화면은 **모양만 그리는 부품**으로 둔다. 데이터는 앱이 가져와서 `data` prop으로 내려주고, 껍데기·액션 버튼·편집 링크는 앱이 빈자리에 끼워 넣는다(`renderShell`/`actionSlot`/`editHrefs`). 동료추가·메시지 보내기 같은 **서버에 쓰는 동작**과 공유 기능, "나" 전용 호출은 전부 앱 쪽에 둔다. 각 앱은 **얇은 연결 부품(어댑터)** 하나로 호출과 동작을 모은다.

- **장점**: 공유 패키지가 "모양만 그리는 부품"으로 깨끗하게 남는다 → plan 묶음(번들)에 career 전용 동작 코드가 안 섞인다. #537이 껍데기를 끼우던 방식을 그대로 이어간다. "내 것 vs 남의 것" 데이터 차이를 앱 어댑터가 올바른 호출로 풀어 준다. 나중에 새 소비처(예: 관리자 화면)가 생겨도 빈자리만 골라 채우면 된다.
- **단점**: 앱 페이지에 버튼 JSX와 데이터 가져오는 코드가 남는다(어댑터로 한 번 묶으면 줄지만 0은 아니다). prop이 많아져 타입이 길어진다.

### B안: 화면 안에 "내 화면 / 남의 화면" 분기를 넣는다

`ProfileView`에 `mode: 'owner' | 'viewer'`를 두고, 화면이 **스스로** "나" 호출 vs id 호출을 갈라 쓰고, 편집·공유·동료추가·메시지 버튼과 서버 동작까지 직접 그린다.

- **장점**: career 페이지가 거의 한 줄이 된다. 데이터 분기가 한곳에 모인다.
- **단점**: plan도 같이 쓰는 공유 패키지가 **plan은 절대 안 쓰는** 동작(동료추가·메시지·공유)을 떠안는다. `mode`로 실행 중에 갈리는 구조라 **안 쓰는 코드를 자동으로 떼어내지 못한다(tree-shake 불가)** → plan 묶음에 죽은 코드가 화면마다 영영 실린다(30번 곱해짐). 또 공유 패키지가 두 앱의 호출 사정을 다 알아야 해서 "한 곳에서만 관리한다"는 원칙이 깨진다. 나중에 plan이 자기 버튼(예: 제안 보내기)을 더하려면 공유 패키지를 고쳐야 한다.

## Decision (무엇을 골랐나)

**A안 채택. B안 기각.** (네 관점 — 묶음 크기·개발 편의·plan 정합·앞으로의 유지보수 — 으로 따로 검토한 결과 모두 A로 모였다.)

핵심은 **두 가지를 따로 떼어 각각 앱이 채우게** 하는 것이다.

```
       어디에 그리나 (껍데기)                누가 보나 (권한)
       ───────────────────                ──────────────────
career ─ 풀페이지 (TopBar + 아래 탭)    내 화면 ─ 전체 정보, 편집·공유 버튼
plan   ─ 오른쪽 패널 (PanelShell)       남 화면 ─ 가려진 정보, 동료추가·메시지

   → renderShell 로 앱이 껍데기 끼움      → actionSlot·editHrefs 로 버튼 끼움
   (career=함수 줌, plan=안 줌)            + 어댑터가 알맞은 호출로 데이터 가져옴
```

B안의 유일한 장점(career 한 줄)은 "공유 부품이 앱 사정을 떠안는다"는 영영 가는 비용에 비하면 약하다. 다만 B가 잘하는 부분 — **껍데기 끼우기**(#537 방식)와 **데이터를 미리 가져와 내려주기** — 는 비용이 없으니 그대로 공통화한다. 서버 동작과 버튼만 앱으로 민다.

### 데이터가 흐르는 모양

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  packages/features  (모양만 그림 — 데이터 가져오기·서버 동작·"나" 호출 전부 없음) │
│                                                                               │
│   <ProfileView>                                                               │
│     ├─ profileId                                                              │
│     ├─ data: ProfileViewData          ◄── 앱이 미리 가져와 내려준 데이터       │
│     ├─ 껍데기 (renderShell │ closeHref+onClose)   ◄ #537 방식 그대로           │
│     ├─ actionSlot?    (안 주면 버튼 줄 안 그림)                                │
│     ├─ editHrefs?     (안 주면 편집 링크 안 그림)                              │
│     ├─ statHrefs?     (안 주면 통계 숫자가 링크 아님)                          │
│     ├─ workEditHref?  (안 주면 작업물 점 3개 메뉴 안 그림)                      │
│     │                                                                         │
│     └─ 그리는 순서:                                                           │
│         <ProfileSummary data + statHrefs?/>                                    │
│         {actionSlot}                  ◄── 앱이 끼운 버튼이 여기 들어감          │
│         <Tab/> ├─ <IntroTab data + editHrefs?/> → <RecommendationList data/>   │
│               └─ <WorksTab workEditHref?/>      → <WorkCard/>(작업물만 직접 가져옴)│
│         껍데기 = renderShell 있으면 그걸로, 없으면 기본 PanelShell             │
└───────────────────────────────────────────────────────────────────────────────┘
          ▲                       ▲                          ▲
          │ 데이터 + 빈자리 채움   │ 데이터 + 빈자리 채움      │ 데이터만, 빈자리 안 채움
┌─────────┴──────────┐ ┌──────────┴─────────┐  ┌──────────────┴──────────────┐
│ career 내 화면      │ │ career 남 화면      │  │ plan 패널                   │
│ (어댑터가 버튼·동작 가짐)│ (어댑터가 버튼·동작 가짐) │  │                             │
│ 가져오는 호출:      │ │ 가져오는 호출:      │  │ 가져오는 호출:              │
│  useGetMyProfile   │ │  useGetProfile(id) │  │  useGetProfile(id)          │
│  useGetMyMember ◄┐ │ │  useGet…({pid})    │  │  useGet…({pid}) (가려진 정보)│
│  useGetMy*추천서 │ │ │  useGet*추천서      │  │                             │
│  (전체 정보)─────┘ │ │  (id, 가려진 정보)  │  │  (id, 가려진 정보)          │
│ 끼우는 것:          │ │ 끼우는 것:          │  │ 끼우는 것: 없음 ✗           │
│  actionSlot=       │ │  actionSlot=       │  │  → 자동으로 읽기 전용        │
│   [프로필수정][공유]│ │   [동료추가][메시지]│  │                             │
│  editHrefs ✓       │ │  서버 동작:         │  │ plan 묶음:                  │
│  statHrefs ✓       │ │   동료추가 요청      │  │  career 동작 0 ✓            │
│  workEditHref ✓    │ │   메시지방 만들기   │  │  공유 기능 0 ✓              │
│  renderShell ✓     │ │  renderShell ✓     │  │  "나" 호출 0 ✓ (자동 제거됨) │
└────────────────────┘ └────────────────────┘  └─────────────────────────────┘
   /profile (내 화면)     /profile/[memberId]      plan 오른쪽 패널
```

### 폴더가 어떻게 바뀌나 (지금 → 목표)

```
packages/features/src/profile/
  ProfileView.tsx          ▲ 껍데기 끼우기(#537) + data prop + 빈자리들. 직접 가져오기 제거
  ProfileSummary.tsx       ▲ statHrefs? 추가 (주면 통계 숫자를 링크로)
  IntroTab.tsx             ▲ 자격·추천서 직접 가져오기 제거 → data prop, editHrefs?
  RecommendationList.tsx   ▲ 받은/보낸 직접 가져오기 제거 → data prop (받은/보낸 토글은 유지)
  WorksTab.tsx             ▲ workEditHref? 추가 (작업물은 가려짐 없는 데이터라 직접 가져오기 유지)
  WorkCard.tsx             ▲ 점 3개 수정 메뉴를 선택 prop으로 흡수
  index.ts                 ▲ ProfileView + 타입들 내보내기

apps/career/src/app/(main)/profile/
  _adapters/
    CareerProfileView.tsx  ＋새 파일: careerShell(껍데기 함수) + 공유 훅
                                  + OwnerProfileView("나" 호출 + 편집/공유)
                                  + ViewerProfileView(id 호출 + 동료추가/메시지)
  page.tsx                 ▽ <OwnerProfileView/> 한 줄짜리 껍데기로 축소
  [memberId]/page.tsx      ▽ <ViewerProfileView memberId/> 한 줄짜리로 축소
  recommendations/page.tsx ▽ 공용 RecommendationList 로 교체 (세 번째 중복본 제거)
  _components/
    ProfileHeader.tsx      ✗ 삭제 → ProfileSummary 가 대신
    IntroSection.tsx       ✗ 삭제 → IntroTab + RecommendationList
    WorksSection.tsx       ✗ 삭제 → WorksTab
    WorkCard.tsx           ✗ 삭제 → 공용 WorkCard

apps/plan/src/app/(main)/@panel/profile/[profileId]/
  page.tsx                 ▲ 데이터를 페이지에서 미리 가져와 내려줌. 껍데기 안 끼움(기본 패널)
                             동작은 그대로 — career 동작/공유/"나" 호출 안 섞임
```

(`certifications/`, `coworkers/`, `edit/` 아래는 이번 작업 범위 밖 — 그대로 둠.)

### 앞으로 남은 ~29개 화면이 따라 할 4단계

1. **껍데기**: `ChatView`/`ProfileView`의 껍데기 끼우기 타입을 그대로 복사한다. career는 한 번 만들어 둔 `careerShell(onBack?)`을 넘기고, plan은 안 넘긴다(그러면 기본 패널). 이 타입 모양은 다시 짜지 말고 그대로 쓴다.
2. **데이터**: 화면이 받을 데이터 묶음 타입(`<화면이름>Data`)을 정한다. 앱/상황마다 갈리는 호출("나" vs id)은 **앱 어댑터가 골라서** 부르고 prop으로 내려준다. 화면은 절대 스스로 안 가져온다 → 이게 패키지를 깨끗하게 유지하는 핵심 규칙. (단, 작업물 목록처럼 "나/남" 차이가 없고 끌어올리기 번거로운 데이터는 화면이 직접 가져와도 된다.)
3. **버튼·링크**: 빈자리를 선택 prop으로 연다(`actionSlot`/`editHrefs`/`statHrefs` 등). 안 주면 그 기능을 안 그린다 → plan/남 화면은 자동으로 읽기 전용이 된다(기존 동작 안 깨짐).
4. **어댑터**: 각 앱이 화면마다 얇은 연결 부품 하나로 호출·서버 동작·공유를 묶는다. 서버 동작과 공유는 앱에 살고, 공유 패키지엔 절대 안 들어간다.

## Consequences (좋은 점·나쁜 점)

- **좋은 점**: plan 묶음에 career 동작 코드가 영영 안 섞인다(안 쓰면 자동 제거). 공유 패키지가 "모양만 그리는 부품"으로 깨끗해서, 90% 화면을 옮겨도 화면 수만큼 얽힘이 쌓이지 않는다. "내 것 vs 남의 것" 데이터 차이를 올바른 호출로 풀어 준다(내 화면은 전체 정보). 옮기는 김에 버그도 같이 고쳐진다(추천서 더보기, 보낸 사람 이름, 로딩 표시, 이미지 최적화).
- **나쁜 점**: 앱 페이지에 버튼 JSX와 데이터 호출 코드가 남는다(어댑터로 줄지만 0은 아니다). prop 타입이 길어진다. 데이터를 위로 올리느라 plan 패널 페이지도 손봐야 한다(동작은 그대로지만 고친 줄은 있다).
- **중립**: 호출 함수 자체를 prop으로 넘기는 방법은 일부러 안 썼다(상황 따라 호출이 갈리면 React 규칙을 어길 위험). 대신 호출한 **결과 데이터**만 내려준다.

## Notes

- 후속: 이 4단계를 `packages/features/README`에 적어 팀이 그대로 따라 하게 한다.
- 검증: career 내 화면/남 화면을 디자인(Figma)과 1:1로 맞추고(mock 로그인) **중복 파일 4개는 화면이 똑같이 나오는 걸 확인한 뒤에만 삭제**. typecheck(career+plan)·lint·`pnpm build:plan` 통과, plan 묶음에 `useCreateCoworkerRequest`/`useCreateDirectChat`/`navigator.share` 안 섞였는지 확인.
- 메시지 화면(`MessagesView`/`ChatView`/`MessageThread`)도 같은 방식으로 따로 진행([#541](https://github.com/mortonCareer/bconnect/issues/541) 하위작업 2).
