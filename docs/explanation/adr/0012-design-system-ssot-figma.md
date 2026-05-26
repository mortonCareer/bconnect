# ADR-0012: 디자인 토큰 — Figma Variables SSOT + Primitive/Semantic 2-layer

- **Status**: Accepted
- **Date**: 2026-05-22
- **Deciders**: @manamana32321, @julyatpark-star
- **Related**: [2026-05-22 회의록](https://www.notion.so/morton-so/367965d2888b8011b077fd5e544029b4) · [globals.css](../../../packages/ui/src/styles/globals.css) · [KRDS](https://www.krds.go.kr/)

## Context

BConnect 프론트엔드의 디자인 토큰이 서로 연결되지 않은 채 흩어져 있다. [globals.css](../../../packages/ui/src/styles/globals.css) 현황:

- `--bconnect-primary` 등 brand 색 — raw 값, 스케일 없음 (primary 단일 + `sub`/`hover` ad-hoc)
- `--background`·`--primary` 등 shadcn 토큰 — 그레이스케일 기본값, **brand 와 미연결** → shadcn `<Button>` 이 검정으로 렌더
- Figma 측은 색이 _Style_ 로 등록 (Variable 아님)
- 헤더 주석은 "SSoT 는 이 CSS 파일, Figma 는 참조용" 이라 명시

핵심 문제는 **semantic 계층의 부재**다. "이 색을 어디에·왜 쓰는가" 를 규정한 토큰이 없어, 컴포넌트가 raw 값을 하드코딩하고 디자인 의도가 코드 어디에도 기록되지 않는다. 쓸 수 있는 "팔레트" 는 있으나 일관된 "시스템" 이 아니다.

계기 — 디자이너가 KRDS(정부 디자인시스템)를 참고해 Figma 색을 Style → Variable 로 재등록하기 시작했고, 이 작업이 SSOT 위치를 강제로 결정하게 만든다.

주요 force:

- **디자인-코드 의미 공유** — 디자이너의 역할 기반 결정이 코드에 전달되는가
- **운영 부담** — 디자이너 1 + FE 2 의 작은 팀
- **drift** — Figma ↔ 코드 동기화 비용

## Options

### Option 1: 코드가 SSOT (현행 유지)

`globals.css` 가 진실, Figma 는 시각 참조.

- **장점**: 현 주석과 일치. FE 에 익숙. 추가 작업 0.
- **단점**: 디자이너가 토큰을 PR 로 바꿔야 함 — 비현실적. semantic 계층 부재 미해결. 디자이너가 Figma Variable 재등록을 이미 시작 → 현행과 모순.

### Option 2: Figma Variables 가 SSOT, 코드가 sync

디자이너가 Figma Variables 에서 토큰 정의, FE 가 `globals.css` 로 반영.

- **장점**: 디자이너가 매일 만지는 곳이 SSOT — 자연스러움. 역할 기반(semantic) 결정을 디자이너가 직접 소유. 현업 토큰 도입 팀의 다수 패턴(KRDS 포함).
- **단점**: Figma → 코드 수동 sync 부담. 디자이너 단일 병목.

### Option 3: DTCG 등 중간 인터체인지 포맷

W3C Design Tokens 포맷을 SSOT 로, Figma·코드가 양쪽에서 참조.

- **장점**: 도구 독립성, lock-in 회피.
- **단점**: 4인 팀에 도구 체인(Tokens Studio + Style Dictionary) 운영 부담 — 푸는 문제(다도구 인터체인지)가 우리 문제가 아님. 명백한 오버스펙.

## Decision

**Option 2 채택** — Figma Variables 가 디자인 토큰 SSOT, FE 가 [globals.css](../../../packages/ui/src/styles/globals.css) 로 sync. 토큰은 **Primitive/Semantic 2-layer** 로 구성한다.

Option 1 은 디자이너가 이미 Variable 재등록을 시작한 현실과 모순되고 semantic 부재를 못 푼다. Option 3 은 작은 팀에 도구 운영 부담만 더한다. Option 2 는 디자이너가 SSOT 를 직접 소유하면서 semantic 계층을 자연스럽게 얹는다.

2026-05-22 회의에서 확정한 파라미터:

1. **2-layer 구조** — Primitive(색 팔레트) + Semantic(역할 토큰). Figma 에서 두 collection 으로 분리, alias 로 semantic → primitive 참조. semantic 계층 도입이 본 ADR 이 푸는 문제의 핵심. Component-level 토큰은 보류.
2. **스케일 11단계** (`50`~`950`) — 모든 색 행 공통. Tailwind v4·shadcn 기본과 1:1 정렬 → 변환 비용 0. "적게 시작 후 확장" 은 후행 토큰 재명명 비용을 키움.
3. **Primitive 구성** — `gray`·`red`·`orange`·`green` 등 비-brand 색은 Tailwind 기성 팔레트를 그대로 사용(Figma 라이브러리로 일괄 등록). `primary`·`secondary` 는 brand 앵커(`#386dff` 등 — 고정 확정)를 [uicolors.app](https://uicolors.app/generate) 으로 11단계 생성 후 디자이너 검수. 비-brand 색은 brand 정체성과 무관하므로 색별 11값 수작업 등록은 불필요한 시간 낭비.
4. **Semantic 네이밍** — `foreground` / `background` / `border` / `action` / `feedback` (shadcn 컨벤션). KRDS 식 `color-text-*` 는 Tailwind 의 `text-` 유틸리티(폰트 크기)와 클래스명이 충돌하므로 채택하지 않음.
5. **System color 점진 도입** — semantic `feedback-error` 부터 정의. `feedback-warning`/`success`/`info` 는 해당 상태를 쓰는 UI 가 실제 생길 때 추가. 미사용 색을 미리 정의하면 대비·foreground 쌍 등 부채를 즉시 떠안음. (단 primitive `red`·`orange`·`green`·`blue` 는 Tailwind 라이브러리에 모두 포함되므로 별도 비용 없이 사전 등록됨 — 점진 도입 대상은 semantic 계층.)
6. **제외** — 다크모드·반응형 토큰·기타 모든 Variable Mode 는 1차 범위에서 제외(light 단일). 디자인 시스템 구축 부담을 우선 관리. 다크모드는 향후 brand 색 다크 변형만 정의하면 단기 도입 가능.
7. **코드 정합** — `--bconnect-*` prefix 제거 → `--color-*` 표준. shadcn 토큰과 brand 토큰 통합(shadcn `--color-primary` 가 brand 를 가리킴).

## Consequences

### 좋은 결과

- 디자인 의도(역할 → 색)가 semantic 토큰으로 명시 기록 — 코드만 봐도 "왜 이 색" 이 드러남
- 디자이너가 Figma 에서 semantic 토큰으로 컴포넌트를 작업 → 핸드오프 의미 손실 제거
- brand 색 변경은 primitive 한 줄, 역할 색 변경은 semantic 한 줄 — 리브랜딩·확장 용이
- shadcn 컴포넌트가 통합된 brand 토큰을 자동 채용 → `<Button>` 등이 brand 색으로 렌더 (현 그레이스케일 버그 해소)

### 나쁜 결과

- Figma → 코드 **수동 sync** — 디자이너 토큰 변경 시 FE 가 `globals.css` 반영 필요. 자동화(Tokens Studio)는 토큰 안정화 후 별도 검토.
- 디자이너 **단일 병목** — 부재 시 토큰 추가 불가. 비상 권한은 향후 필요 시 정함(현재 미정).

### 중립적 결과

- `globals.css` 헤더 주석의 SSOT 방향 반전 ("코드가 SSoT" → "Figma 가 SSoT")
- `--bconnect-*` → `--color-*` 마이그레이션 (~10 파일)
- 코드 ↔ Figma drift 3건 정리: `--bconnect-primary-hover`·`--bconnect-error`(코드 전용), `gray-900`(Figma Variable 누락)

## Notes

- **범위** — 1차는 color. shadow·border-width·radius 도 1차 variant 등록 대상이나 본 ADR 은 color 토큰 구조에 집중. typography·component 토큰은 2차.
- **후속 작업** — [packages/ui/CLAUDE.md](../../../packages/ui/CLAUDE.md) 에 토큰 네이밍 컨벤션(Figma Variable 명 = `@theme` 변수명 글자단위 일치) 명문화.
- **재검토 시점** — 수동 sync 가 분기 5회 이상 반복되면 Tokens Studio 자동화 검토. 다크모드 도입 시 본 ADR 의 "제외" 항목을 새 ADR 로 supersede.
