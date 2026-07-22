---
name: fe-qa
description: Use when asked to QA, E2E-test, or verify a frontend page/component/flow in a real browser (chrome-devtools MCP), when a feature is "done" and needs runtime verification against a real or mocked backend, when UI/UX aspects (hover·focus states, responsive layout, accessibility, copy quality) need selective checking, or when QA findings need a shareable evidence report. Triggers - "QA 해줘", "E2E 검증", "브라우저로 확인", "시나리오 테스트", "UI/UX 검증", "hover 확인", "반응형 확인", "접근성 확인", "fe-qa", "잘 되는지 확인".
---

# FE E2E QA

## Overview

브라우저 구동 QA 하네스. 코드에서 시나리오 매트릭스를 역산(happy path + **모든** 에러 시나리오)하고, chrome-devtools MCP로 실행하며, 매 스텝 콘솔·네트워크를 스위프해 번외 버그까지 잡고, Artifact 증거 보고서를 발행한 뒤, 승인된 버그만 GitHub 이슈로 만든다.

**핵심 원칙 1**: 요청자는 happy path만 말한다. 에러 시나리오(4xx, 클라이언트 에러, 유효성 위반)는 요청에 없어도 **항상** 매트릭스에 포함한다.
**핵심 원칙 2**: typecheck·mock green은 런타임 정합을 증명하지 않는다. 브라우저에서 실측한 것만 검증이다.

## 입력

- **대상** (필수): 페이지 / 컴포넌트 / 플로우. 생략 시 **대화 맥락에서 추론** — 이 세션에서 방금 작업·논의한 기능을 후보로 뽑아 AskUserQuestion으로 확인받는다. 맥락에 후보가 없을 때만 open-ended로 묻는다.
- **환경** `fe=<env> be=<env>` (local | dev | prod | mock 등, 프로파일이 정의): 지정 없으면 AskUserQuestion으로 받는다. FE와 BE는 서로 다른 환경 조합 가능.
- **검증 층위**: 기본은 **기능/계약**(시나리오 매트릭스). 사용자가 UI/UX를 언급하거나 요청이 시각·상호작용 품질을 함의하면 **UX 층위**를 opt-in으로 제안 — 아래 "UX QA 층위" 참조. 대상 확정 직후 AskUserQuestion(multiSelect)으로 어느 UX 차원을 켤지 받는다.

## Phase 0 — 프로파일 & 환경 해석

1. **프로파일 매칭**: `git remote get-url origin` + repo root 경로를 이 스킬의 `projects/*.md` frontmatter `match:` 패턴과 대조. 매치되면 그 파일을 읽고 전체를 따른다 (환경 정의, 로그인 레시피, 하드룰, known-issues, 이슈 컨벤션).
2. **미매치 → generic 모드**: 코드베이스 스캔으로 즉석 프로파일 구성 — 검증 라이브러리(zod/yup/valibot/RHF resolver), API 클라이언트(openapi spec, generated hooks, fetch wrapper), dev 서버 스크립트, 에러 envelope 규약. 스캔 결과를 `projects/_template.md` 형식으로 정리해 "프로파일로 저장할까?" 제안.
3. **환경 조합 리스크 브리핑**: 프로파일의 조합별 함정(예: cross-site 쿠키, mock의 실계약 미검증)을 확인하고 해당되면 실행 전에 사용자에게 고지. **prod에 write 시나리오가 있으면 반드시 사전 승인.**
4. **서버 소유권**: dev 서버·BE를 직접 기동/종료하지 않는다 — 프로파일이 명시적으로 허용한 경우만 예외. 필요하면 사용자에게 기동을 요청하고 대기.

## Phase 1 — 시나리오 매트릭스 (승인 게이트)

요청 문구가 아니라 **코드에서** 도출한다:

| 소스                        | 도출                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 검증 스키마 (zod 등)        | 필드별 위반 입력: 형식 위반, 경계값(min-1/max+1/정확히 min·max), 빈값, optional 생략. 기대 = "요청 미발생 + 필드 에러 표시" — 서버 4xx와 층이 다름, 섞지 말 것 |
| API 스펙 / generated client | 해당 엔드포인트가 정의한 4xx별 유발 방법 (이 환경에서 가능한지 표기)                                                                                           |
| UI 코드                     | 로딩 상태, 빈 상태, 에러 렌더, 중복 제출 방지                                                                                                                  |
| happy path                  | 요청받은 본 시나리오 + 저장 후 재조회(영속성, optimistic UI 오탐 배제)                                                                                         |

매트릭스를 표(시나리오 | 절차 | 기대 결과 | 환경 제약)로 제시하고 **사용자 승인 후 실행**. 이 환경에서 유발 불가한 시나리오는 삭제하지 말고 `BLOCKED(사유)`로 남긴다 — 커버리지 공백을 침묵시키지 않는다.

**UX 층위가 켜졌으면** 켠 차원별로 UX 행을 매트릭스에 추가한다(예: "A: 제출 버튼 hover/disabled 상태", "B: 상세 페이지 375px 반응형", "E: 폼 카피 조사·플레이스홀더"). 대상 요소가 여럿이면 대표 요소로 묶되 커버 범위를 명시한다.

## Phase 2 — 실행 + 상시 스위프

시나리오마다:

1. 브라우저 드라이브 (chrome-devtools MCP: `take_snapshot` → uid 기반 `fill`/`click`, 특수 입력은 프로파일 레시피).
2. 증거 캡처: 스크린샷(프로파일 지정 임시 디렉토리, 없으면 `.tmp/screenshots/`), `list_network_requests` — 네비게이션으로 리스트가 리셋되는 write 요청은 `includePreservedRequests: true`로 회수, 핵심 요청은 `get_network_request`로 payload·응답 body까지.
3. 판정: PASS / FAIL / BLOCKED + 증거 참조.

**모든 스텝에서 백그라운드 스위프** (대상 시나리오와 무관하게):

- 콘솔: 에러, 워닝, hydration mismatch, unhandled rejection (`list_console_messages`)
- 네트워크: 예상 밖 4xx/5xx, envelope/계약 위반 응답, 중복 호출, 비정상 payload

스위프 히트는 프로파일 `known-issues`와 대조 → 기존이면 `KNOWN(#이슈번호)` 표기로 강등, 신규만 **번외 버그**로 승격. 번외 버그도 본 시나리오와 동급으로 증거를 캡처한다.

**UX 층위가 켜졌으면** 아래 "UX 스위프"도 매 스텝 함께 돈다.

## UX QA 층위 (opt-in)

기능 QA와 성격이 다르고 무겁다 → **기본 off**. 대상 확정 직후 AskUserQuestion(multiSelect)으로 켤 차원을 받는다(전체/일부). 켜진 차원은 Phase 1 매트릭스에 UX 행으로 추가되고, Phase 2 실행에 아래 검증이 붙는다. UX 발견도 기능 버그와 **동급으로 증거(스크린샷) 캡처** + 보고서 severity 표기(대개 low~med; 접근성 차단·법적/오인 카피는 high).

각 차원은 "무엇을 / 어떻게(chrome-devtools MCP 도구) / PASS 기준":

| 차원 | 무엇을 | 어떻게 | PASS 기준 |
|---|---|---|---|
| **A 상호작용 상태** | 버튼·링크·입력의 hover / focus / active / disabled | `hover` → `take_screenshot` diff, `evaluate_script`로 computed `cursor`·`color` 확인 | hover 시 시각 피드백 변화 존재, focus 링 가시, disabled는 클릭 무효 + 시각 구분 |
| **B 반응형** | 뷰포트 375 / 768 / 1440 | `resize_page` 각 폭 → snapshot + screenshot | 가로 스크롤 없음, 레이아웃 안 깨짐, nav 적응, 탭타겟 ≥44px |
| **C 접근성** | 키보드 네비 · aria · 대비 | `press_key` Tab 연타로 focus 순서, Esc로 모달, `evaluate_script`로 alt/label/aria 감사, 콘솔 a11y 워닝 수집 | focus 순서 논리적+가시, 모달 focus trap + Esc, 모든 이미지 alt, form 요소 label/id, 대비 충분 |
| **D 로딩/빈/에러 시각** | 스켈레톤 · 빈 상태 · 에러 렌더 | 네트워크 스로틀(느리게) → 로딩 관찰, 빈 데이터 경로 진입 | 로딩 인디케이터 존재, 빈 상태 안내 카피, 에러 시 크래시 없이 렌더 |
| **E 카피/i18n** | 조사 · title · 플레이스홀더 · raw 문구 | snapshot 텍스트 스캔 | 한국어 조사(으로/로·은/는·이/가) 정확, title 중복 없음, 〔미정〕·lorem·raw 서버 에러문구 미노출, 언어 혼용 없음 |
| **F 마이크로 인터랙션** | 트랜지션 · 토스트 · 모달 · 레이아웃 시프트 | `performance_start_trace` + 스크린샷 시퀀스 | 토스트 표시·자동소멸, 모달 열림/닫힘 부드러움, 클릭 즉시 피드백, 레이아웃 시프트 최소 |
| **G 비주얼 폴리시** | 간격 · 정렬 · 위계 · AI-slop | `fullPage` 스크린샷 심사(design-review 렌즈) | 간격 일관, 정렬 맞음, 위계 명확, 제네릭 AI 패턴 회피 |
| **H 디자인 피델리티** | Figma 원본 vs 실제 브라우저 렌더 일치(간격 px·색·폰트·요소 누락) | Figma MCP `get_screenshot`(디자인 노드 이미지) + `get_variable_defs`·`get_metadata`(토큰·정확한 값·좌표) → chrome `take_screenshot`(같은 뷰포트) → 나란히 비교, 불일치 항목 diff | 간격·색·폰트·정렬이 디자인과 일치, 요소 누락/추가 없음, 브레이크포인트별 의도대로. 차이는 "디자인값 vs 구현값"으로 명기 |

**H는 G와 다르다**: G는 디자인 없이도 잘 만들었나(휴리스틱), H는 **Figma가 SSOT일 때 그것과 1:1 일치하나**(스펙 대조). **선행조건**: Figma MCP 연결 + **연결된 계정이 해당 파일에 접근권(팀/타인 소유 파일은 editor 공유 필요 — 개인 계정 바인딩이면 못 읽음)** + 사용자가 **파일/노드 링크 + 노드↔화면 매핑** 제공. 하나라도 없으면 H는 `BLOCKED(사유: 링크 미제공 / 접근권 없음)`. 접근 불가 시 대안: 사용자가 디자인 스크린샷을 직접 제공 → 그것과 브라우저 렌더 대조.

**UX 스위프** (켜졌을 때 매 스텝 추가): 콘솔 a11y 워닝 수집(C) · 뷰포트 전환 시 가로 오버플로우 감시(B) · 화면 텍스트의 조사·플레이스홀더·raw 문구 스캔(E). 기능 스위프와 달리 대상 요소가 인터랙티브하면 hover/focus도 즉석 확인(A).

## Phase 3 — Artifact 보고서

`report-template.html`을 골격으로 채워 Artifact 도구로 발행:

- 요약: 매트릭스 verdict 표 + 환경 조합 + 커버리지 공백(BLOCKED 목록)
- 시나리오 카드: 스크린샷(base64 data URI — CSP가 외부 요청 차단, JPEG 다운스케일로 용량 관리) + 요청/응답 발췌 + 콘솔 발췌 + verdict
- 번외 버그 섹션: 동일 카드 형식
- 버그별 **이슈 초안**: 제목 / 본문(재현 절차·기대·실제·증거) / 레이블 — 프로파일 이슈 컨벤션 준수

## Phase 4 — 이슈화

1. AskUserQuestion(multiSelect)으로 이슈 팔 버그 선택받기 — 초안 전문은 보고서에 이미 있음.
2. 승인된 것만 `gh issue create` (본문은 `--body-file`). 프로파일의 템플릿·레이블·언어 규칙 준수.
3. 생성된 이슈 링크를 보고서에 역기입하고 같은 URL로 재배포.
4. 이번 실행에서 발견한 새 노이즈·함정은 프로파일 known-issues / 레시피에 추가 제안.

## Red Flags — 멈추고 다시

| 합리화                                     | 현실                                                        |
| ------------------------------------------ | ----------------------------------------------------------- |
| "happy path만 요청받았으니 그것만"         | 에러 시나리오 자동 포함이 이 스킬의 존재 이유               |
| "typecheck green이니 계약은 맞을 것"       | 런타임 실측 전에는 미검증                                   |
| "이 4xx는 유발 어려우니 매트릭스에서 빼자" | 빼지 말고 BLOCKED로 명시                                    |
| "콘솔 워닝은 노이즈니 스킵"                | 스위프 → known-issues 대조 → 분류가 절차                    |
| "서버 내가 빨리 띄우면 되는데"             | 소유권은 프로파일이 정한다. 기본은 사용자                   |
| "스크린샷 대충 repo root에"                | 임시 디렉토리만 (repo root는 훅이 차단하는 프로젝트도 있음) |
| "버그 확실하니 이슈 바로 생성"             | 초안 → 사용자 선택 → 생성. 순서 고정                        |
| "UX 층위 켰는데 hover는 눈으로 됐겠지"      | hover는 `hover` 도구로 실제 구동 + 스크린샷. 스냅샷엔 hover 상태 안 나옴 |
| "데스크탑서 멀쩡하니 반응형 스킵"          | B 켰으면 375/768 실제 `resize_page`. 데스크탑 통과 ≠ 모바일 통과 |
| "콘솔 a11y 워닝은 사소"                     | C 켰으면 수집 대상. form id/name·alt 누락은 실 접근성 결함 |
| "카피 오타쯤이야"                          | 조사(으로/로)·플레이스홀더(〔미정〕)·raw 에러문구는 E의 정식 발견 |
| "Figma랑 비슷해 보이니 됐지" | H는 눈대중 X. Figma `get_screenshot`+실제 스크린샷 나란히, 간격·색은 값으로 대조 |
