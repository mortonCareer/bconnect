# ADR-0023: career 앱 Google Play 안드로이드 패키징

- 상태: 승인됨
- 날짜: 2026-06-15
- 담당자: @manamana32321

## 개요

career 를 Google Play Store 에 안드로이드 전용으로 등록·배포해야 한다. career 는 기술자 PWA 다. 출시 대상은 Play 단일 채널이다. iOS/Windows 패키징은 범위 밖이다.

career 는 이미 설치형 PWA 의 요건을 갖추고 있다.

- 도메인 https://bconnect.to, 자사 소유
- `manifest.ts` : `name`/`short_name`/`display: standalone`/`theme_color`/`icons` 192·512 (`purpose: 'any'`)
- 서비스워커 `firebase-messaging-sw.js`, FCM 푸시 등록

즉 "웹은 이미 완성형 PWA"다. 결정 대상은 이 PWA 를 Play 에 올리기 위한 빌드/패키징 도구 선택이다. 핵심 force:

1. 선언적 관리: 설정이 git 에 커밋 가능한 파일로 남아야 한다. SSOT·IaC 를 선호한다. GUI 에서만 사는 설정은 기피한다.
2. Play 정책 리스크: 2026년 Play 는 "thin wrapper / minimum functionality"를 강하게 거른다. 도구 선택이 곧 정책 리스크 선택이다.
3. 웹 변경 시 재빌드 비용: career 는 dev→main 머지마다 Vercel 로 웹이 자주 배포된다. 웹 변경마다 앱을 재빌드·재제출해야 한다면 운영 부담이 크다.
4. CI 자동화: GitHub Actions 에서 `.aab`를 재현 가능하게 빌드할 수 있어야 한다.
5. 표준성/신뢰도: 메인테이너·활성도·Google 공식 권장 여부.

### 배경 개념: TWA vs WebView 래퍼

- TWA(Trusted Web Activity): 안드로이드 앱이 사용자 기기의 Chrome 렌더링 엔진으로 라이브 URL https://bconnect.to 을 풀스크린으로 로드한다. 브라우저 UI 는 없다. 앱은 사실상 "주소창 없는 Chrome 탭"이다. 콘텐츠는 네트워크에서 실시간 로드된다.
- WebView 래퍼: Capacitor 등이 해당한다. 앱이 자체 `WebView` 컴포넌트에 콘텐츠를 띄운다. `WebView` 는 브라우저 대체가 아니다. Capacitor 는 웹 자산을 앱 번들 안에 동봉하는 네이티브 셸이다.

이 차이가 force 3 재빌드와 force 2 정책을 동시에 가른다.

## 선택지

### 옵션 1: Bubblewrap (GoogleChromeLabs 공식 TWA CLI)

PWA 를 TWA 안드로이드 프로젝트로 생성하는 CLI 다. `twa-manifest.json` 한 파일로 설정을 선언하고, `build`로 `.aab`, 즉 Android App Bundle 을 산출한다.

장점

- TWA 표준. 콘텐츠를 라이브 URL 에서 로드하므로 웹만 배포하면 끝이고 앱 재빌드·재제출이 불필요하다. force 3 를 완벽 충족한다. 앱 재빌드는 manifest 나 네이티브 동작을 바꿀 때만 필요하다. manifest 변경은 이름·아이콘·시작 URL 등이다.
- 설정이 `twa-manifest.json` 단일 파일이라 git 커밋 가능하고 선언적이다. force 1 충족.
- `fingerprint generateAssetLinks` 서브커맨드가 `assetlinks.json` 을 자동 생성한다. Digital Asset Links 워크플로가 자동화된다.
- GoogleChromeLabs 조직, Apache-2.0, ~3,000 stars, 60개 릴리스, 의존성 업데이트 등 활성 유지보수. 최신은 v1.24.1, 2025-09-29 다. web.dev/Chrome 공식 문서가 권장 도구로 명시한다.
- 순수 CLI 라 GitHub Actions 에서 `.aab` 빌드 자동화가 자연스럽다. force 4 충족.

단점

- 로컬/CI 에 JDK 17 + Android command-line tools 가 필요하다. 점검은 `bubblewrap doctor` 로 한다. 첫 셋업 마찰이 있다.
- 리포지토리에 "This is not an officially supported Google product" 면책 문구가 있다. 조직은 공식 Google Chrome Labs 이나 SLA 는 없다.
- TWA 한계 전반을 그대로 떠안는다. 아래 "알려진 함정" 참조. 단 career 는 모두 충족 가능하다.

### 옵션 2: PWABuilder (Microsoft, 웹 UI + CLI)

PWA URL 을 입력하면 안드로이드 패키지를 만들어주는 Microsoft GUI 다. 내부 엔진이 Bubblewrap 이라 산출물은 TWA 로 동일하다. 엔진은 same underlying core 다.

장점

- GUI 라 진입장벽이 최저다. 안드로이드 외 iOS/Windows 도 한 화면에서 처리한다.
- 산출물이 TWA 라 옵션 1 과 동일한 정책·재빌드 이점을 갖는다.

단점

- 패키징이 pwabuilder.com 웹 UI 전용이다. 설정이 GUI 폼에 머물고 git 에 선언적으로 남지 않는다. force 1 위반이며 본 결정의 핵심 기피 사유다.
- GitHub Actions 1급 CLI 경로가 없다. force 4 가 약하다.
- Bubblewrap 위 얇은 래퍼라 "표준성"은 결국 Bubblewrap 에 귀속된다. 굳이 한 겹 더 끼울 이유가 없다.

### 옵션 3: Capacitor (Ionic, WebView 네이티브 셸, TWA 아님)

웹 자산을 안드로이드 프로젝트에 동봉해 네이티브 셸로 감싸는 크로스플랫폼 런타임이다. 플러그인으로 네이티브 API 에 접근한다.

장점

- 네이티브 플러그인 생태계가 풍부하다. 카메라·생체인증 등이 있다. 깊은 네이티브 통합이 목표라면 강력하다.
- WebView 라 Chrome 60+ 등 폭넓은 기기와 호환된다.

단점

- TWA 가 아니라 WebView 래퍼라 2026 Play minimum-functionality 정책 리스크에 직격된다. force 2 위반이다. "그냥 웹사이트 같은" 앱은 거부 대상이다.
- 웹 자산을 앱에 동봉하므로 웹을 바꿀 때마다 `cap sync` + 재빌드 + Play 재제출이 필요하다. 대안은 Appflow 유료 OTA 별도 도입이다. force 3 를 정면 위반한다. career 의 잦은 Vercel 배포 모델과 상극이다.
- career 에 네이티브 요구가 없다. 푸시는 이미 FCM 웹이다. 동봉·재빌드·정책 리스크를 감수할 이득이 없다.

## 결정사항

Bubblewrap, 즉 옵션 1 을 채택한다.

career 는 이미 완성형 PWA 이고 출시 목표가 "이 웹을 Play 에 안드로이드로 올리기"다. 따라서 콘텐츠를 라이브 URL 에서 로드하는 TWA 가 본질적으로 정합한다. 우선시한 force 와 트레이드오프는 다음과 같다.

- force 3 재빌드와 force 1 선언적을 최우선으로 봤다. TWA 는 웹 배포만으로 앱 콘텐츠가 갱신되어 운영 부담이 최소다. 설정은 `twa-manifest.json` 한 파일로 git 에 남는다. 이 둘이 career 운영 모델과 정확히 맞는다. career 운영 모델은 잦은 Vercel 배포와 IaC 선호다.
- PWABuilder 대비: 같은 TWA 산출물이지만 GUI 전용 설정이 force 1 선언적과 force 4 CI 를 깬다. 엔진이 Bubblewrap 이므로 한 겹 래퍼를 벗고 Bubblewrap 을 직접 쓴다.
- Capacitor 대비: 동봉·재빌드·정책 리스크라는 비용을 career 가 필요로 하지 않는 "깊은 네이티브 통합"과 맞바꾸는 셈이라 정당화되지 않는다.
- 받아들인 트레이드오프: 로컬/CI 에 JDK 17 + Android SDK 셋업 마찰, 그리고 TWA 본연의 제약이다. TWA 제약은 최소 Chrome 86, assetlinks 검증 필수 등이다. career 는 모두 충족 가능하므로 수용한다.

### Play 정책 리스크 검증 (TWA vs WebView 래퍼)

2026 Play 는 "소유권 없는 사이트의 단순 래퍼 / 최소기능 앱"을 minimum-functionality 정책으로 거부한다. 그러나 적법한 TWA 는 허용된다. career 가 안전한 논리는 다음과 같다.

1. 도메인 소유 증명: bconnect.to 는 자사 도메인이다. `/.well-known/assetlinks.json`의 Digital Asset Links 로 앱↔도메인 관계를 암호학적으로 증명한다. "남의 사이트 래퍼"가 아니다.
2. 서비스워커 필수 통과: Play TWA 심사는 등록된 서비스워커와 오프라인 응답을 요구한다. career 는 `firebase-messaging-sw.js`로 서비스워커가 이미 있다. 오프라인 폴백 보강은 구현 시 검토한다.
3. 풀 PWA: HTTPS + web manifest + 서비스워커 + 설치형 요건을 충족하므로 Lighthouse PWA 기준을 통과한다.

요약하면 minimum-functionality 정책이 겨눈 것은 "기능 없는 남의 사이트 WebView 래퍼"다. career 는 자사 PWA 를 도메인 소유 증명 위에 올린 TWA 이므로 정책상 안전하다.

## 기대 효과

- 좋은 결과:
  - 웹 배포만으로 앱 콘텐츠가 갱신된다. 웹 배포는 Vercel 이다. 콘텐츠 변경에 Play 재제출이 불필요하다. 재제출은 앱 메타나 네이티브 동작 변경 시에만 한다. 앱 메타는 이름·아이콘·시작 URL 이다.
  - 설정 SSOT 가 `twa-manifest.json` 한 파일이라 리뷰·재현·CI 가 가능하다.
  - `.aab`를 GitHub Actions 에서 자동 빌드할 수 있다. JDK 17 + Android SDK 를 셋업한 잡이 필요하다.
  - TWA 라 정책 리스크가 낮다. Chrome 엔진이라 웹 호환성·성능이 브라우저와 동일하다.
- 나쁜 결과:
  - 빌드 환경에 JDK 17 + Android command-line tools 의존성이 추가된다. 로컬·CI 모두 해당한다. `bubblewrap doctor`로 점검이 필요하다.
  - 키스토어/서명 키 관리 책임이 발생한다. 업로드 키 분실 시 복구 절차가 필요하다.
  - Bubblewrap 은 "공식 지원 제품 아님" 면책이라 이슈 대응이 베스트에포트다.
- 중립적 결과:
  - 안드로이드 전용이다. iOS 는 별도 결정 대상이다. 향후 PWABuilder iOS 또는 Capacitor 를 재검토할 수 있으며 본 ADR 범위 밖이다.
  - Play App Signing 옵트인은 권장 사항이다. 로컬 서명 키는 "업로드 키"가 되고, 실제 배포 서명은 Play 가 수행한다.

## 메모

빌드 환경 셋업, assetlinks 지문 규칙(Play 서명키), 키스토어 시크릿 분리 등 운영 디테일은 ADR 범위 밖이다. 구현 시 트래킹 이슈 #630 및 별도 how-to 로 관리한다.

- [GoogleChromeLabs/bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [web.dev : Using a PWA in your Android app](https://web.dev/articles/using-a-pwa-in-your-android-app)
- [Play Console Help : Use Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

## 참조

- career PWA : `apps/career`, https://bconnect.to
- `apps/career/src/app/manifest.ts`
- `apps/career/src/app/firebase-messaging-sw.js`
