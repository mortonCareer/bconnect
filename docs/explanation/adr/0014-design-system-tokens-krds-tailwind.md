# ADR-0014: 디자인 시스템 — KRDS 체계 + Tailwind 값

- **Status**: Accepted (ADR-0012 부분 supersede)
- **Date**: 2026-05-29
- **Deciders**: @manamana32321, @julyatpark-star
- **Related**: [ADR-0012](./0012-design-system-ssot-figma.md) · [2026-05-29 합의 Notion](https://www.notion.so/morton-so/36f965d2888b8011b6eec951dc49c5a4) · [코드 반영 PR #405](https://github.com/mortonCareer/bconnect/pull/405) · [KRDS 토큰 시스템](https://www.krds.go.kr/html/site/utility/utility_03.html)

## Context

[ADR-0012](./0012-design-system-ssot-figma.md)는 **색 토큰**의 2-layer 구조(Primitive/Semantic) + Tailwind 팔레트 사용을 결정했다. 그러나 컴포넌트가 늘면서 색 외 토큰(크기·간격·상태·반응형·계층 등)을 다룰 체계가 없다는 한계가 드러났다.

문제 상황:

- 토큰 어휘가 색에 한정 — 크기·상태·반응형·계층 등을 다룰 공통 어휘 부재.
- 디자이너와 개발자 사이 작업의 공유 시스템 부재. 예: 한 화면을 `MobileButton`·`DesktopButton`으로 이원화하면 관리 부담 2배.
- LLM 가독성 향상 필요 — 일관된 토큰 어휘가 코드 생성·리팩토링 품질에 직접 영향.

주요 고려사항:

- **체계 일관성** — 색만 잡으면 도리어 부채(다른 카테고리 즉흥 도입).
- **현업 표준** — 정부 디자인 시스템(KRDS) 체계와 Tailwind 어휘 양쪽이 자리 잡음.
- **운영 부담** — 디자이너 1 + FE 2의 작은 팀.

## Options

### Option 1: shadcn 어휘만 확장

shadcn/ui의 토큰 어휘(`primary`/`secondary`/`destructive`/`muted` 등)를 그대로 쓰고, 필요 시 색 외 카테고리를 추가.

- **장점**: 코드 변경 최소. ADR-0012와 자연스럽게 이어짐.
- **단점**: shadcn은 색 위주 어휘 — 크기·상태·반응형·계층 같은 체계가 본래 없음. 색 외 토큰은 또 즉흥 도입.

### Option 2: KRDS 전체 도입(어휘·값 모두)

KRDS 토큰의 어휘와 값을 그대로 옮긴다.

- **장점**: 정부 표준과 정합.
- **단점**: KRDS 색 값이 Morton 브랜드와 안 맞음. Tailwind v4 기반 스택에서 KRDS의 `color-text-*` 식 어휘는 Tailwind 유틸(`text-`)과 클래스 충돌. 디자이너가 별도로 라이브러리 정의 — 비용·관리 부담 큼.

### Option 3: KRDS 체계 + Tailwind 값

KRDS의 **속성 카테고리 체계**(Theme/Responsive/Variant/State/Size/Modifier)를 따르되, 실제 **토큰 값**은 Tailwind 시스템을 그대로 사용. brand 색만 커스텀 스케일(ADR-0012 유지).

- **장점**: 체계는 정부 표준에서, 값은 2026년 프론트 사실상 표준(Tailwind)에서 — 양쪽 장점 결합. 디자이너는 카테고리만 결정하고 값은 라이브러리에서 가져옴. Tailwind 유틸 충돌 회피.
- **단점**: KRDS·Tailwind·shadcn 어휘를 부분 혼합하는 1차 비용. ADR-0012의 일부 결정이 바뀌어 supersede 필요.

## Decision

**Option 3 채택** — KRDS 체계 + Tailwind 값.

전반적인 체계는 [KRDS 토큰 시스템](https://www.krds.go.kr/html/site/utility/utility_03.html)을 따르며, 실제 토큰의 값은 [Tailwind 시스템](https://www.figma.com/community/file/958383439532195363/official-tailwind-css-styles)의 토큰 값을 따른다. ADR-0012가 잡은 색 토큰의 2-layer 구조·Figma Variables SSOT·brand 11단계 스케일·`--color-*` prefix는 **그대로 유지**한다.

### 세부 속성 카테고리 (6개)

컴포넌트 정의 시 6개 카테고리를 모두 채울 필요는 없다. **필요한 것만 순차적으로 정의하되 아래 어휘를 준수**한다.

| 카테고리            | 어휘                                                       | 비고                                      |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| **Theme**           | `{light, dark}`                                            | 다크는 PMF 검증 후 도입                   |
| **Responsive**      | `{mobile, desktop}`                                        | **모든 컴포넌트 필수 속성** — 이원화 금지 |
| **Variant: 계층**   | `{primary, secondary, tertiary}`                           | brand 색                                  |
| **Variant: 시스템** | `{danger, warning, success, info}`                         | 시스템 알림 색                            |
| **State: 기본**     | `{default, hover, pressed}`                                | 상호작용                                  |
| **State: 데이터**   | `{loading, error}`                                         | 비동기                                    |
| **State: 선택**     | `{selected, unselected, interminate}`                      | 토글·체크박스                             |
| **State: 열림**     | `{open, closed}`                                           | 펼침·드로어                               |
| **Size**            | `{xxsmall, xsmall, small, medium, large, xlarge, xxlarge}` | 7단계                                     |
| **Modifier**        | 미정                                                       | 향후 정의                                 |

### Semantic 토큰 추가 절차

1. **Primitive 토큰 정의** — Tailwind 라이브러리에 있으면 그대로 쓰고, 없으면 새로 정의.
2. **Semantic 토큰 연결** — Primitive 중에서 골라 참조. 별도 정의 X.

### 컴포넌트 추가 절차

1. **기존 라이브러리 탐색** — [shadcn/ui](https://ui.shadcn.com/docs/components) → [Figma 커뮤니티](https://www.figma.com/community/file/1342715840824755935). 있으면 사용, 없으면 새로 정의.
2. **Variant 정의** — 위 6개 카테고리에서 필요한 속성·값. **반응형(mobile/desktop)은 필수**.
3. **토큰 연결** — 가능하면 semantic 토큰, 임시로 primitive 가능. 연결 대상: 오토레이아웃(간격·패딩), 외형(radius), 채우기, 외곽선(색·굵기), 효과(그림자).
4. **Ready for Dev** — Figma에서 표시 → 개발 시작.
5. **개발 결과물 리뷰** — 개발자 산출물 디자이너 리뷰.

### 페이지 추가 절차

모든 페이지는 Figma 프레임으로 구성되어야 한다.

## ADR-0012와의 관계 (부분 supersede)

ADR-0012의 결정 중 일부는 그대로 유지하고, 일부는 본 ADR-0014가 대체한다.

| 항목                       | ADR-0012                                                    | ADR-0014                            | 관계     |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------- | -------- |
| Primitive/Semantic 2-layer | ✓                                                           | ✓                                   | **유지** |
| Tailwind 팔레트 사용       | ✓                                                           | ✓                                   | **유지** |
| Figma Variables SSOT       | ✓                                                           | ✓                                   | **유지** |
| `--color-*` prefix         | ✓                                                           | ✓                                   | **유지** |
| brand 11단계 스케일        | ✓                                                           | ✓                                   | **유지** |
| 다크모드 1차 제외          | ✓                                                           | ✓ (PMF 후)                          | **유지** |
| 반응형 토큰 1차 제외       | ✓                                                           | ✗ (필수로 격상)                     | **대체** |
| 계층 variant               | primary/secondary                                           | + **tertiary**                      | **확장** |
| 시스템 색 어휘             | `feedback-error`/`destructive`                              | **`danger`** + warning/success/info | **대체** |
| State 어휘                 | 명시 없음(hover는 scale step)                               | **`default/hover/pressed`** 등 명시 | **추가** |
| Size 어휘                  | 명시 없음                                                   | **7단계** 어휘 정의                 | **추가** |
| Semantic 네이밍            | shadcn 어휘(`foreground/background/border/action/feedback`) | KRDS 체계 어휘 + Tailwind 값        | **재편** |

따라서 ADR-0012의 status는 `Superseded in part by ADR-0014`로 표시한다.

## Consequences

### 좋은 결과

- 색 외 카테고리(크기·상태·반응형 등)도 일관된 어휘로 다룸 — 즉흥 도입 차단.
- 반응형이 variant로 통합돼 `MobileX`/`DesktopX` 이원화 부담 제거.
- LLM 가독성 향상 — 일관된 토큰 어휘는 코드 생성·리팩토링 품질에 직접 영향.
- 컴포넌트 추가·페이지 작성 절차가 문서화돼 신규 합류자 onboarding 비용 감소.

### 나쁜 결과

- 토큰 어휘 재명명 비용 — 특히 `destructive` → `danger` 등(현 코드 약 28파일 사용). [PR #405](https://github.com/mortonCareer/bconnect/pull/405) 머지 후 별도 PR로 정리.
- 반응형 토큰 도입 비용 — primitive·semantic 양쪽에 mobile/desktop 값 정의 필요.
- KRDS·Tailwind·shadcn 어휘 사이 부분 혼합 — 일부 경계에서 어떤 어휘를 쓸지 판단 필요(예: shadcn `muted` 유지 vs KRDS 식 어휘로 교체).

### 중립적 결과

- ADR-0012의 일부 결정이 본 ADR로 부분 supersede됨.
- [Notion 합의 페이지](https://www.notion.so/morton-so/36f965d2888b8011b6eec951dc49c5a4)는 휘발성 — 본 ADR이 Git 영구 기록(SSOT).

## Notes

### 후속 작업

- [ ] [PR #405](https://github.com/mortonCareer/bconnect/pull/405) 머지 — ADR-0012 기준의 1차 코드 반영.
- [ ] 토큰 어휘 변경 PR — `destructive` → `danger` (`Input.tsx` 등 약 28 파일), 필요 시 `feedback-*` 계열 추가.
- [ ] 반응형 토큰 도입 PR — primitive·semantic에 mobile/desktop 어휘 도입, 컴포넌트별 적용 순차.
- [ ] tertiary brand 색 — 디자이너가 앵커 확정 후 11단계 스케일 정의.
- [ ] pressed 상태 토큰화 — 현재 `active:` modifier로 처리. 디자이너 결정에 따라 토큰화 여부 정함.
- [ ] Size 7단계의 실제 값 — primitive로 정의(예: `--size-medium: 16px`).

### 참고

- [2026-05-29 합의 Notion](https://www.notion.so/morton-so/36f965d2888b8011b6eec951dc49c5a4) — 합의의 원전. 본 ADR로 Git에 영구 기록.
- [KRDS 토큰 시스템](https://www.krds.go.kr/html/site/utility/utility_03.html)
- [Tailwind 공식 Figma 라이브러리](https://www.figma.com/community/file/958383439532195363/official-tailwind-css-styles)
- 컴포넌트 라이브러리: [shadcn/ui](https://ui.shadcn.com/docs/components), [Figma 커뮤니티 — Once UI](https://www.figma.com/community/file/1342715840824755935).

### 재검토 시점

반응형 mobile/desktop이 실제로 충분한지(태블릿 필요 여부), 다크모드 도입 시점, system color 4종 전부 정의 필요성 — 운영하며 재검토.
