# ADR-0021: plan 우측 패널 — search param 상태 (parallel route 제거)

- **Status**: Accepted
- **Date**: 2026-06-09
- **Deciders**: @manamana32321
- **Related**: [ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md) (이 결정이 supersede) · [ADR-0020](./0020-dual-shell-view-sharing-rendershell-resolved-data.md) (공유 뷰 계약, 유지) · [#568](https://github.com/mortonCareer/bconnect/issues/568) · [#375](https://github.com/mortonCareer/bconnect/issues/375) (공정표, PR [#566](https://github.com/mortonCareer/bconnect/pull/566))

## Context

[ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md)은 plan 우측 패널(프로필/메시지/알림)을 **path 기반 parallel route slot**(`@panel`)으로 구현했다. 패널 정체성이 URL **path**에 들어간다 (`/profile/5`, `/messages/3`).

그 설계엔 숨은 가정이 있었다: **"패널은 기술자 탐색(explore) 위에만 뜬다."** 실제로 `/profile/5` 진입 시 children 슬롯은 항상 `(main)/default.tsx`(explore)로 떨어진다. 당시 plan의 유일한 메인 콘텐츠가 explore였기에 문제가 드러나지 않았다.

[#375](https://github.com/mortonCareer/bconnect/issues/375) 공정표 페이지(`(main)/projects/[projectId]/schedule`)가 **explore가 아닌 첫 메인 라우트**로 등장하며 한계가 드러났다:

- parallel slot은 **path로 파일이 매칭**된다. `@panel/profile/[profileId]/page.tsx`가 렌더되려면 URL path가 그에 맞아야 한다.
- 한 URL path는 하나뿐 → "메인 path = `/projects/1/schedule`" 와 "패널 path = `/profile/5`"가 **한 URL에 공존할 수 없다.**
- 공정표를 보다가 패널을 열면(`/profile/5`로 push) children이 explore로 강제 복귀 → **공정표가 사라진다.** soft·hard nav 무관.
- soft nav로 다른 메인에 진입할 때 직전 패널 subtree가 보존되는 Next 동작이 있으나, 이는 라우트별 `@panel/.../page.tsx` null 페이지로만 통제 가능해 **모든 신규 메인 라우트마다 보일러플레이트**를 요구하고, "패널을 연 채로 메인 전환"은 여전히 불가능하다.

공정표·모집관리·문서저장소 등 프로젝트 메인 라우트가 늘수록 이 한계는 확산된다. 구체적 요구: **공정표 assignee를 클릭하면 그 기술자 프로필 패널을 공정표를 유지한 채 띄운다.**

**제약/force**:

- ADR-0017이 path 기반을 택한 핵심 이유 = 닫기/뒤로/새로고침/공유의 web 시맨틱을 프레임워크에 위임. 새 설계도 **이 이점을 잃으면 안 된다.**
- career(기술자 PWA)는 `@panel`을 쓰지 않는다 — 프로필/메시지/알림이 전부 full-page 라우트(`careerShell` 래핑, ADR-0020). career는 이 변경과 **무관**해야 한다.
- 공유 뷰 패키지 `@bconnect/features`(ADR-0020 presentation-only 계약)는 **그대로 유지**해야 한다.

## Options

### Option A: search param 패널 상태 + PanelHost (parallel route 제거) — 채택

패널 정체성을 path → search param 으로 옮긴다: `?panel=profile/5`, `?panel=messages/3`, `?panel=notifications`. `(main)/layout.tsx`에 client `PanelHost`가 상주하며 `?panel=`을 읽어 해당 패널을 dispatch·렌더. `@panel/` parallel slot 디렉토리는 제거.

- **장점**: 패널이 메인 path와 디커플 → **어떤 메인 콘텐츠 위에도 공존**. 새로고침 생존(URL의 param을 layout이 복원)·뒤로/앞으로·공유 모두 유지(ADR-0017이 주던 이점 그대로). parallel-route 파일매칭 체조 제거로 신규 메인 라우트마다 보일러플레이트 불필요. `usePanelNav` 공개 API(`panelHref`/`openPanel`/`close`/`PanelSegment`)를 유지하면 트리거(사이드바·카드·feature 콜백)는 거의 무변경.
- **단점**: parallel route의 슬롯별 `loading.tsx`/`error.tsx` 스트리밍·RSC 서버렌더를 잃음 — 단 현 패널은 전부 client(orval 훅)라 ADR-0017 시점부터 이미 포기 상태이므로 실손실 0(loading/error는 PanelHost 내 Suspense/ErrorBoundary로 처리). 패널 segment 파싱을 직접 해야 함.

### Option B: parallel route 유지 + 라우트별 @panel null 페이지

`@panel`을 유지하되 메인 라우트마다 `@panel/<route>/page.tsx`(null)을 깔아 soft nav 시 패널을 명시적으로 닫는다.

- **장점**: 기존 구조 최소 변경.
- **단점**: "패널을 연 채로 비-explore 메인 보기"라는 **핵심 요구를 못 푼다** (두 path 공존 불가). 신규 메인마다 null 보일러플레이트. 근본 한계 잔존.

### Option C: intercepting routes

[ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md)이 이미 기각 — hard load 시 하위 full route를 강제 렌더해 원치 않는 full-page 변종을 만든다. 두 path 공존 문제도 동일하게 못 푼다.

## Decision

**Option A 채택.** parallel route는 "고정 위치의 독립 슬롯이 각자 URL 세그먼트로 변하는" 케이스용 도구이지, "메인 path와 무관하게 떠다니는 전역 오버레이"용이 아니다. 후자는 search param 상태가 표준·적합하다.

search param은 ADR-0017이 중시한 force(닫기/뒤로/새로고침/공유의 web 시맨틱)를 **그대로 보존**하면서 메인 콘텐츠 공존까지 얻는다. parallel route를 잃지만 현 패널이 client인 이상 실손실이 없다.

**PoC로 검증**(2026-06-09): `PanelHost`(프로필) + `(main)/layout.tsx` 마운트로 공정표 위 프로필 패널 공존 / 새로고침 생존(hard load) / 닫기(soft, param 제거 후 공정표 유지) / 뒤로·앞으로(history 복원) / `@panel` 슬롯 무충돌 / 콘솔 클린 전부 확인. 스파이크는 검증 후 폐기.

이 결정은 [ADR-0017](./0017-plan-panel-parallel-routes-shared-features.md)을 supersede 한다. ADR-0017의 다른 결정(공유 feature 패키지 `@bconnect/features`)은 [ADR-0020](./0020-dual-shell-view-sharing-rendershell-resolved-data.md)과 함께 **유지**된다 — 본 ADR은 패널의 **URL/렌더 메커니즘**만 바꾼다.

## Consequences

- **좋은 결과**: 프로필/메시지/알림 패널이 explore·공정표·향후 프로젝트 페이지 등 **어떤 메인 위에도** 뜬다. 새로고침/뒤로/공유 유지. 신규 메인 라우트는 패널 관련 보일러플레이트 0. parallel-route 인지부하 제거(레포 전체 parallel route 0). 트리거는 `usePanelNav` 공개 API 유지로 거의 무변경.
- **나쁜 결과**: plan의 기존 패널 URL(`/profile/5` 등 path)이 사라짐 — pre-launch 내부 앱이라 외부 링크 없음, redirect 불필요. `@panel` 8파일 → `PanelHost`+`Panel*` 컴포넌트로 이주(데이터 prep 로직 동일). ADR 번복(0017 supersede)에 따른 문서/맥락 추적 비용.
- **중립적 결과**: career·`@bconnect/features`는 무영향. 패널 segment 파싱이 PanelHost에 집중됨(단일 책임).

## Notes

- 구현 범위·순서는 [#568](https://github.com/mortonCareer/bconnect/issues/568) 및 implementation plan 참조.
- `?panel=` 값은 기존 `PanelSegment`(예 `profile/5`, `profile/5/coworkers`, `messages`, `messages/3`, `notifications`)의 leading slash 제거형으로 둔다 — 기존 타입/트리거 의미 보존.
- 필터 search param(`?trade=…`)과 공존: `?panel=`은 별도 key라 nuqs로 독립 set/clear, 기존 필터 보존.
