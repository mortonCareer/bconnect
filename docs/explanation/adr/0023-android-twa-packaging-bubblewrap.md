# ADR-0023: career 앱 Google Play 안드로이드 패키징 — Bubblewrap (TWA)

- **Status**: Accepted
- **Date**: 2026-06-15
- **Deciders**: @manamana32321
- **Related**: career PWA (`apps/career`, https://bconnect.to), `apps/career/src/app/manifest.ts`, `apps/career/src/app/firebase-messaging-sw.js`

## Context

career(기술자 PWA)를 **Google Play Store에 안드로이드 전용**으로 등록·배포해야 한다. 출시 대상은 Play 단일 채널이고, iOS/Windows 패키징은 범위 밖이다.

career는 이미 설치형 PWA의 요건을 갖추고 있다:

- 도메인 https://bconnect.to (자사 소유)
- `manifest.ts` — `name`/`short_name`/`display: standalone`/`theme_color`/`icons` 192·512 (`purpose: 'any'`)
- 서비스워커 `firebase-messaging-sw.js` (FCM 푸시 등록)

즉 "웹은 이미 완성형 PWA"이고, 결정 대상은 **이 PWA를 Play에 올리기 위한 빌드/패키징 도구 선택**이다. 핵심 force:

1. **선언적 관리** — 설정이 git에 커밋 가능한 파일로 남아야 한다 (SSOT, IaC 선호). GUI에서만 사는 설정은 기피.
2. **Play 정책 리스크** — 2026년 Play는 "thin wrapper / minimum functionality"를 강하게 거른다. 도구 선택이 곧 정책 리스크 선택이다.
3. **웹 변경 시 재빌드 비용** — career는 dev→main 머지마다 Vercel로 웹이 자주 배포된다. 웹 변경마다 앱을 재빌드·재제출해야 한다면 운영 부담이 크다.
4. **CI 자동화** — GitHub Actions에서 `.aab`를 재현 가능하게 빌드할 수 있어야 한다.
5. **표준성/신뢰도** — 메인테이너·활성도·Google 공식 권장 여부.

### 배경 개념: TWA vs WebView 래퍼

- **TWA(Trusted Web Activity)**: 안드로이드 앱이 사용자 기기의 **Chrome 렌더링 엔진**으로 라이브 URL(https://bconnect.to)을 풀스크린(브라우저 UI 없이) 로드한다. 앱은 사실상 "주소창 없는 Chrome 탭"이다. 콘텐츠는 네트워크에서 실시간 로드된다.
- **WebView 래퍼(Capacitor 등)**: 앱이 자체 `WebView` 컴포넌트(브라우저 대체가 아님)에 콘텐츠를 띄운다. Capacitor는 웹 자산을 **앱 번들 안에 동봉(bundle)** 하는 네이티브 셸이다.

이 차이가 force 3(재빌드)과 force 2(정책)를 동시에 가른다.

## Options

### Option 1: Bubblewrap (GoogleChromeLabs 공식 TWA CLI)

PWA → TWA 안드로이드 프로젝트를 생성하는 CLI. `twa-manifest.json` 한 파일로 설정을 선언하고, `build`로 `.aab`(Android App Bundle)를 산출한다.

- **장점**:
  - TWA 표준. 콘텐츠를 라이브 URL에서 로드 → **웹만 배포하면 끝, 앱 재빌드/재제출 불필요** (force 3 완벽 충족). 앱 재빌드는 manifest(이름·아이콘·시작 URL 등)나 네이티브 동작을 바꿀 때만.
  - 설정이 `twa-manifest.json` 단일 파일 → **git 커밋 가능, 선언적** (force 1 충족).
  - `fingerprint generateAssetLinks` 서브커맨드가 `assetlinks.json` 자동 생성 (Digital Asset Links 워크플로 자동화).
  - GoogleChromeLabs 조직, Apache-2.0, ~3,000 stars, 60개 릴리스(최신 v1.24.1, 2025-09-29), 의존성 업데이트 등 활성 유지보수. web.dev/Chrome 공식 문서가 권장 도구로 명시.
  - 순수 CLI → GitHub Actions에서 `.aab` 빌드 자동화 자연스러움 (force 4).
- **단점**:
  - 로컬/CI에 **JDK 17 + Android command-line tools** 필요(`bubblewrap doctor`로 점검). 첫 셋업 마찰.
  - 리포지토리에 "This is not an officially supported Google product" 면책 문구(조직은 공식 Google Chrome Labs이나 SLA 없음).
  - TWA 한계 전반(아래 "알려진 함정")을 그대로 떠안음 — 단, career는 모두 충족 가능.

### Option 2: PWABuilder (Microsoft, 웹 UI + CLI)

PWA URL을 입력하면 안드로이드 패키지를 만들어주는 Microsoft GUI. **내부 엔진이 Bubblewrap**(same underlying core)이라 산출물은 TWA로 동일.

- **장점**:
  - GUI라 진입장벽 최저. 안드로이드 외 iOS/Windows도 한 화면에서.
  - 산출물이 TWA → Option 1과 동일한 정책·재빌드 이점.
- **단점**:
  - **패키징이 pwabuilder.com 웹 UI 전용** → 설정이 GUI 폼에 머물고 git에 선언적으로 남지 않음 (force 1 위반, 본 결정의 핵심 기피 사유).
  - GitHub Actions 1급 CLI 경로 부재 (force 4 약함).
  - Bubblewrap 위 얇은 래퍼 → "표준성"은 결국 Bubblewrap에 귀속. 굳이 한 겹 더 끼울 이유 없음.

### Option 3: Capacitor (Ionic, WebView 네이티브 셸 — TWA 아님)

웹 자산을 안드로이드 프로젝트에 **동봉**해 네이티브 셸로 감싸는 크로스플랫폼 런타임. 플러그인으로 네이티브 API 접근.

- **장점**:
  - 네이티브 플러그인 생태계(카메라·생체인증 등) 풍부. 깊은 네이티브 통합이 목표라면 강력.
  - WebView라 Chrome 60+ 등 폭넓은 기기 호환.
- **단점**:
  - **TWA가 아니라 WebView 래퍼** → 2026 Play minimum-functionality 정책 리스크 직격 (force 2). "그냥 웹사이트 같은" 앱은 거부 대상.
  - **웹 자산을 앱에 동봉** → 웹을 바꿀 때마다 `cap sync` + 재빌드 + **Play 재제출**(또는 Appflow 유료 OTA 별도 도입) 필요 (force 3 정면 위반). career의 잦은 Vercel 배포 모델과 상극.
  - career에 네이티브 요구가 없다(푸시는 이미 FCM 웹). 동봉·재빌드·정책 리스크를 감수할 이득이 없음.

## Decision

**Bubblewrap (Option 1)** 을 채택한다.

career는 이미 완성형 PWA이고 출시 목표가 "이 웹을 Play에 안드로이드로 올리기"이므로, 콘텐츠를 라이브 URL에서 로드하는 **TWA가 본질적으로 정합**한다. 우선시한 force와 트레이드오프:

- **force 3(재빌드) + force 1(선언적)을 최우선**으로 봤다. TWA는 웹 배포만으로 앱 콘텐츠가 갱신되어 운영 부담이 최소이고, 설정이 `twa-manifest.json` 한 파일로 git에 남는다. 이 둘이 career 운영 모델(잦은 Vercel 배포, IaC 선호)과 정확히 맞는다.
- **PWABuilder 대비**: 같은 TWA 산출물이지만 GUI 전용 설정이 force 1(선언적)·force 4(CI)를 깬다. 엔진이 Bubblewrap이므로 한 겹 래퍼를 벗고 Bubblewrap을 직접 쓴다.
- **Capacitor 대비**: 동봉/재빌드/정책 리스크라는 비용을, career가 필요로 하지 않는 "깊은 네이티브 통합"과 맞바꾸는 셈이라 정당화되지 않는다.
- 받아들인 트레이드오프: 로컬/CI에 JDK 17 + Android SDK 셋업 마찰, 그리고 TWA 본연의 제약(최소 Chrome 86, assetlinks 검증 필수 등). career는 모두 충족 가능하므로 수용한다.

### Play 정책 리스크 검증 (TWA vs WebView 래퍼)

2026 Play는 "소유권 없는 사이트의 단순 래퍼 / 최소기능 앱"을 minimum-functionality 정책으로 거부한다. 그러나 **적법한 TWA는 허용**된다. career가 안전한 논리:

1. **도메인 소유 증명** — bconnect.to는 자사 도메인이고, `/.well-known/assetlinks.json`의 Digital Asset Links로 앱↔도메인 관계를 **암호학적으로 증명**한다. "남의 사이트 래퍼"가 아니다.
2. **서비스워커 필수 통과** — Play TWA 심사는 등록된 서비스워커(+오프라인 응답)를 요구한다. career는 `firebase-messaging-sw.js`로 서비스워커가 이미 있다(오프라인 폴백 보강은 구현 시 검토).
3. **풀 PWA** — HTTPS + web manifest + 서비스워커 + 설치형 요건 충족 → Lighthouse PWA 기준 통과.

요약: minimum-functionality 정책이 겨눈 것은 "기능 없는 남의 사이트 WebView 래퍼"이고, career는 자사 PWA를 도메인 소유 증명 위에 올린 TWA이므로 정책상 안전하다.

## Consequences

- **좋은 결과**:
  - 웹(Vercel) 배포만으로 앱 콘텐츠 갱신 — 콘텐츠 변경에 Play 재제출 불필요. 재제출은 앱 메타(이름·아이콘·시작 URL)·네이티브 동작 변경 시에만.
  - 설정 SSOT가 `twa-manifest.json` 한 파일 → 리뷰·재현·CI 가능.
  - `.aab`를 GitHub Actions에서 자동 빌드 가능(JDK 17 + Android SDK 셋업한 잡).
  - TWA라 정책 리스크 낮음, Chrome 엔진이라 웹 호환성·성능이 브라우저와 동일.
- **나쁜 결과**:
  - 빌드 환경에 JDK 17 + Android command-line tools 의존성 추가(로컬·CI). `bubblewrap doctor`로 점검 필요.
  - 키스토어/서명 키 관리 책임 발생(업로드 키 분실 시 복구 절차 필요).
  - Bubblewrap은 "공식 지원 제품 아님" 면책 — 이슈 대응이 베스트에포트.
- **중립적 결과**:
  - 안드로이드 전용. iOS는 별도 결정(향후 PWABuilder iOS 또는 Capacitor 재검토 가능, 본 ADR 범위 밖).
  - Play App Signing 옵트인(권장) → 로컬 서명 키는 "업로드 키"가 되고, 실제 배포 서명은 Play가 수행.

## Notes

빌드 환경 셋업·assetlinks 지문 규칙(Play 서명키)·키스토어 시크릿 분리 등 **운영 디테일은 ADR 범위 밖** — 구현 시 트래킹 이슈 #630 및 별도 how-to 로 관리.

- [Bubblewrap (GoogleChromeLabs)](https://github.com/GoogleChromeLabs/bubblewrap)
- [web.dev — Using a PWA in your Android app](https://web.dev/articles/using-a-pwa-in-your-android-app)
- [Use Play App Signing (Play Console Help)](https://support.google.com/googleplay/android-developer/answer/9842756)
