# career 안드로이드 TWA 빌드

career PWA를 [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)으로 안드로이드 TWA(Trusted Web Activity)로 패키징한다. TWA는 콘텐츠를 라이브 URL에서 로드하므로 **웹 배포만으로 앱 내용이 갱신**되고, 재빌드는 앱 메타(host·아이콘·이름·버전)가 바뀔 때만 한다. 결정 배경은 [ADR-0023](../../../docs/explanation/adr/0023-android-twa-packaging-bubblewrap.md).

> **For**: career 앱을 Play/사이드로드로 배포·재빌드하는 사람.
> **You'll be able to**: 도메인·아이콘·이름·버전 변경 후 TWA를 재빌드해 새 apk/aab를 얻는다.

## 커밋되는 것 / 안 되는 것

**커밋**: `twa-manifest.template.json`(설정 SSOT) · `setup-toolchain.sh` · `build.sh` · 이 README.

**커밋 안 함** (`.gitignore`):

- `android.keystore` — 서명 키. **레포 밖 안전한 곳에 백업**하고, 빌드 시 이 디렉토리로 복사만 한다. 분실하면 같은 `packageId`로 업데이트 서명이 불가능해진다 (재설치 강제).
- 서명 패스워드 — 환경변수(`TWA_KEYSTORE_PASSWORD`/`TWA_KEY_PASSWORD`)로 주입. 스크립트·파일에 하드코딩 금지.
- `twa-manifest.json` — `twa-manifest.template.json` + `build.sh <env>`로 host를 주입해 생성. SSOT는 템플릿.
- 빌드 산출물(`*.apk`/`*.aab`), gradle·bubblewrap 생성물(`app/`, `build/`, `*.gradle` 등) — `twa-manifest.json`에서 재생성됨.

## 빌드 절차

```bash
# 0. (최초 1회) 툴체인 셋업 — JDK17 + Android SDK + bubblewrap 설정
./setup-toolchain.sh

# 1. android.keystore 를 이 디렉토리에 복사 (레포 밖 보관본에서)

# 2. twa-manifest.template.json 편집 (아이콘/이름/버전 변경 시). 재빌드 시 appVersionCode 를 반드시 +1
#    host 는 편집하지 않음 — build.sh 인자(dev|prod)로 결정

# 3. 서명 패스워드 주입 후 빌드 (인자로 host 선택)
export TWA_KEYSTORE_PASSWORD=... TWA_KEY_PASSWORD=...
./build.sh prod   # career.bconnect.to (Play/실서비스)
./build.sh dev    # career.dev.bconnect.to (사이드로드 테스트)
```

산출물: `app-release-signed.apk`(사이드로드) + `app-release-bundle.aab`(Play 업로드).

**사이드로드 설치**: apk를 폰에 복사 → 탭해서 설치. 같은 키스토어면 기존 앱 위에 업데이트로 설치된다.

## Digital Asset Links (풀스크린 검증)

앱↔도메인 관계는 각 도메인의 `/.well-known/assetlinks.json`이 증명한다 (career FE public에 서빙: [`apps/career/public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json)). 여기 든 SHA-256 지문이 맞아야 주소창 없이 풀스크린으로 뜬다.

`sha256_cert_fingerprints`는 배열이고 앱은 **자기 지문이 그 배열에 있는지**만 본다. 그래서 두 배포 경로의 지문을 함께 싣는다 (#1112).

- **Play 배포** (`career.bconnect.to`, 내부 테스트 포함): Play App Signing이 AAB를 재서명하므로 지문은 **Play 콘솔 › 앱 무결성 › 앱 서명 키 인증서 SHA-256**. 로컬 키 지문이 아니다.
- **사이드로드 dev** (`career.dev.bconnect.to`): 로컬 `android.keystore`의 서명 지문 (`keytool -printcert -jarfile app-release-signed.apk`로 확인). 같은 키로 재빌드하면 지문 불변.

`packageId`가 dev·prod 공통이고 `public/`은 두 환경에 같은 파일이 배포되므로 statement는 하나면 된다. 지문만 갱신할 때는 **웹 배포만** 하면 되고 앱 재빌드·재업로드는 필요 없다 — TWA가 실행 시점에 도메인에서 읽는다. 단 prod 도메인 반영은 dev 머지가 아니라 **main 통합까지** 되어야 한다.

host를 바꾸면(예: #902 `dev.bconnect.to`→`career.dev.bconnect.to`) **새 host에도 같은 assetlinks가 서빙되는지** 확인하고 재빌드한다.
