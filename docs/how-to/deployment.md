# 배포 프로세스

> 대상: 모든 개발자<br>
> 학습 목표: 서비스를 절차에 따라 배포하고 헬스체크 · 롤백 할 수 있다

## 프론트엔드

프론트엔드 서버는 GitHub Actions 워크플로우 [vercel-deploy.yml](../../.github/workflows/vercel-deploy.yml)를 통해 배포됩니다.

- PR 프리뷰는 현재 비활성화 (`preview_deployments_disabled = true`)
- 워크플로우 수동 배포 가능

### 배포 환경

career

| 환경    | URL                      | 트리거             |
| ------- | ------------------------ | ------------------ |
| `local` | `localhost:3000`         | `pnpm dev:career`  |
| `dev`   | `career.dev.bconnect.to` | `dev` 브랜치 push  |
| `prod`  | `career.bconnect.to`     | `main` 브랜치 push |

plan

| 환경    | URL                    | 트리거             |
| ------- | ---------------------- | ------------------ |
| `local` | `localhost:3001`       | `pnpm dev:plan`    |
| `dev`   | `plan.dev.bconnect.to` | `dev` 브랜치 push  |
| `prod`  | `plan.bconnect.to`     | `main` 브랜치 push |

company

| 환경    | URL               | 트리거             |
| ------- | ----------------- | ------------------ |
| `local` | `localhost:3002`  | `pnpm dev:company` |
| `dev`   | `dev.bconnect.to` | `dev` 브랜치 push  |
| `prod`  | `bconnect.to`     | `main` 브랜치 push |

### 배포 절차

## 백엔드

### 배포 환경

플랫폼: Railway

| 환경    | URL                   | 배포 트리거         | 데이터                         |
| ------- | --------------------- | ------------------- | ------------------------------ |
| `local` | `localhost:8080`      | `./gradlew bootRun` | `data.sql`, `data-crawler.sql` |
| `dev`   | `api.dev.bconnect.to` | `dev` 브랜치 push   | `data.sql`                     |
| `prod`  | `api.bconnect.to`     | `main` 브랜치 push  | -                              |

### 배포 방법

- Railway 자동 배포
- 환경 변수 주입 : [manage-variables.md](./manage-variables.md)
- 인프라 구성 : [infra-railway.md](../reference/infra-railway.md)

## 가이드

### 체크리스트

배포 전

- [ ] CI 성공 · PR 승인
- [ ] 환경 변수 누락 확인
- [ ] 데이터베이스 마이그레이션 확인
- [ ] 사용자 공지 (다운타임 발생 시)
- [ ] CD 승인

배포 후

- [ ] 헬스체크 통과 확인 `/_health`
- [ ] URL 접속 확인
- [ ] 주요 기능 스모크 테스트
- [ ] 에러 로그 모니터링 (첫 10분)
- [ ] 성능 모니터링

### 문제 발생 시

1. 즉시 롤백 (플랫폼 대시보드)
2. 문제 분석 (로그 확인)
3. 핫픽스 브랜치 생성
4. 수정 후 긴급 배포

## TWA 앱 배포

Career 앱은 [GoogleChromeLabs/bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)을 활용해 패키징합니다.

TWA는 콘텐츠를 웹 URL을 통해 불러오므로 앱은 메타데이터 변경 시에만 재빌드합니다. 메타 데이터가 변경되지 않았다면 직전 릴리스의 aab, apk 파일을 사용해도 무관합니다.

### 명령어

```bash
./setup-toolchain.sh    # 초기 세팅 (최초 1회)
./build.sh dev
./build.sh prod
```

### 배포 절차

1. `twa-manifest.template.json` 메타데이터 변경
2. `appVersionCode` 값 +1
3. `build.sh` 스크립트 실행 (`host` 값 결정)

산출물:

- `app-release-signed.apk` : 로컬 테스트용 (dev)
- `app-release-bundle.aab` : 플레이스토어 배포용 (prod)

안드로이드는 키스토어를 통해 동일 앱 여부를 식별하므로 관리에 특별히 주의바랍니다.

### Digital Asset Links

TWA나 WebView 기반 앱에서 주소창을 숨기고 풀스크린 모드를 활성화하려면 Digital Asset Links 검증에 성공해야 합니다.

검증 절차

1. 앱은 `sha256_cert_fingerprints` 배열에 하나 이상의 지문을 포함한다
2. 앱은 호스트 `/.well-known/assetlinks.json` 지문을 확인하여 적어도 하나의 원소가 일치하면 검증을 통과한다

웹 서비스는 다음 두 배포 경로에 대한 지문을 `./well-known/assetlinks.json`에 포함시켜야 합니다.

| 배포 경로    | Host                     | 서명 키           | 배열에 넣을 지문                        |
| ------------ | ------------------------ | ----------------- | --------------------------------------- |
| 로컬         | `career.dev.bconnect.to` | 환경변수 키스토어 | 환경변수 키스토어 서명 지문             |
| 플레이스토어 | `career.bconnect.to`     | Play App Signing  | Google Play Console SHA-256 인증서 지문 |

- 로컬 서명 지문은 `keytool -printcert -jarfile app-release-signed.apk`로 확인
- 플레이스토어 업로드시 Play App Signing이 AAB를 재서명하여 기존 키스토어 서명을 대체합니다.
- 플레이스토어 지문은 'Play 콘솔 | Google Play로 보호됨'에서 확인

## 릴리스

prod 환경으로의 릴리스는 [Semantic Versioning](https://semver.org) 버저닝 전략을 따릅니다.

```bash
git fetch origin main
git tag <tag> <commit-sha>
git push origin <tag>
gh release create <tag> --title <tag> --generate-notes # 릴리스 노트 자동 생성
gh release upload <tag> <file> # 에셋(abb, apk 등) 첨부
```

커밋을 Squash 하지 말고, Merge 커밋을 생성하세요.

## 참조

- TODO 인프라 관리 문서
- [환경변수 관리](./manage-variables.md)
