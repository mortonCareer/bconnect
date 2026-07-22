---
# 프로젝트 식별: git remote URL 또는 repo root 경로에 대한 substring/glob 패턴 (하나라도 매치되면 로드)
match:
  - "github.com/OWNER/REPO"
  - "/home/USER/PROJECT-worktrees"
---

# <프로젝트명> FE QA 프로파일

## 환경

<!-- fe/be 인자로 받을 수 있는 값들과 각각의 실체. 조합별 함정 필수. -->

| env | FE | BE | 비고 |
|---|---|---|---|
| local | http://localhost:PORT (기동: ...) | ... | |
| dev | https://... | https://... | |
| prod | https://... | https://... | write 시나리오 사전 승인 |

### 조합별 함정

<!-- 예: FE local + BE dev → cross-site 쿠키 미전송, mock BE → 실계약 미검증 -->

## 서버 소유권

<!-- 기본: 사용자가 띄움, 스킬은 navigate만. 직접 기동 허용이면 명시. -->

## 로그인 레시피

<!-- 환경별 인증 획득 방법. 테스트 계정, OTP/2FA 처리, 세션 재사용 전략. -->

## 계약 (contract)

<!-- 에러 envelope 형식, API 클라이언트 산출물 경로, 검증 스키마 위치 관례 -->

## 브라우저 드라이브 레시피

<!-- 특수 입력 처리법: 네이티브 date input, portal listbox, 권한 프롬프트 등 -->

## UX 레시피 (opt-in 층위용)

<!-- UX 층위 켰을 때 참조. 없으면 generic 기본값 사용.
- 반응형 브레이크포인트: 예 375 / 768 / 1440 (Tailwind sm/md/lg 등 프로젝트 기준)
- hover/focus 규약: 예 hover 시 배경색 변화, focus-visible 링 색
- a11y 기준: 대비 목표(WCAG AA), 필수 aria 패턴
- 카피/i18n: 한국어 조사 규칙, title 템플릿, 금지 플레이스홀더(〔미정〕/lorem 등) -->

## 스크린샷 저장 위치

<!-- gitignored 경로. 기본 .tmp/screenshots/ -->

## 이슈 컨벤션

<!-- 템플릿, 레이블 규칙, 언어, 담당자 규칙, 외부 소통 여부 -->

## known-issues (스위프 노이즈 억제)

<!-- 실행마다 갱신. 형식: - 증상 — 원인/이슈번호 -->
