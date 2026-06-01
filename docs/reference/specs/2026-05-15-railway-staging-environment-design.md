# Railway Staging 환경 프로비저닝 설계

> **For**: [#351](https://github.com/mortonCareer/bconnect/issues/351) 구현자·리뷰어, ADR-0009 를 참조하는 미래 합류자.
> **You'll be able to**: ADR-0009 의 "같은 프로젝트 별도 environment" 결정을 현 community provider 제약 아래 어떻게 구현하는지, 환경별 브랜치 분기를 왜 1회성 GUI 수동 단계로 처리하는지 파악한다.

- **Related**: [#351](https://github.com/mortonCareer/bconnect/issues/351), [ADR-0009](../../explanation/adr/0009-be-db-hosting-railway-staging.md), [ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md), [#352](https://github.com/mortonCareer/bconnect/issues/352), [#353](https://github.com/mortonCareer/bconnect/issues/353)
- **Status**: 승인됨 (2026-05-15, brainstorming. 초기 안 "별도 프로젝트(Approach B)"는 provider 리서치 보강 후 폐기 — §2 참조.)

본 문서는 **설계 결정**만 다룬다. 파일 배치·리소스 주소·변수 이름 같은 implementation detail 은 후속 구현 계획에서 결정한다.

## 1. 배경

[ADR-0009](../../explanation/adr/0009-be-db-hosting-railway-staging.md) 의 결정: Railway 유지 + BE+DB staging 환경 추가 + **"같은 프로젝트 내 별도 environment"**. [ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md) 이 dev 브랜치 FE → staging BE 통합을 결정. #351 단계에서 staging BE 가 `dev` 브랜치를 추적해야 함을 확정.

### Provider 리서치

Morton 이 사용하는 `terraform-community-providers/terraform-provider-railway` v0.6.2 는 환경별 브랜치 분기를 **declarative 로 노출하지 않는다**:

- 과거에 `railway_deployment_trigger` 리소스(branch + environment_id + service_id)가 PR #12 로 추가됐다가, 커밋 [`9f6d96b`](https://github.com/terraform-community-providers/terraform-provider-railway/commit/9f6d96b) (2025-03-25)로 **의도적으로 제거**됨.
- 포크 [`wertlex/terraform-provider-railway`](https://github.com/wertlex/terraform-provider-railway) (v0.4.x, abandoned, 0 stars, 마지막 push 가 정확히 제거 당일)에 잔존하나 인프라 종속 위험.
- [Railway Help Station 응답](https://station.railway.com/questions/service-deployments-to-specific-environm-900a7743): Railway 직원이 "Terraform provider 는 unofficial, 우리가 유지보수 안 함, community 에 문의" — 공식 declarative 경로 부재.

→ 현 provider 로는 환경별 branch 가 declarative 로 불가능하나, **Railway 제품 자체는 환경별 branch override 를 GUI 로 지원**하며 **TF 는 그 override 를 drift 로 보지 않는다** (project-level service 의 branch 값만 모델링; per-env override 는 Railway 내부 모델에 별도 저장 → TF 시야 밖).

기존 prod postgres volume 도 같은 "Railway GUI 수동 + 주석 문서화" 패턴으로 운영되고 있다 — Morton 은 이미 *완전 선언적*이 아닌 _실용적 선언적_ 입장을 받아들이고 있음.

## 2. 결정 — Approach A-revised

ADR-0009 의 결정대로 **같은 Railway 프로젝트 내 별도 staging environment** 로 구성. Railway 상 environment 이름은 **`dev`** ([ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md) 의 `dev` 브랜치 추적과 일치). 환경별 브랜치 분기는 **1회성 Railway GUI 설정 + 주석 문서화** (postgres volume 과 동일 패턴).

> **구현 시 보강 (2026-06-01)**: community provider v0.6.2 에는 **data source 가 없고**, `railway_environment` 리소스로 빈 환경을 만들어도 **prod 서비스(api/postgres)를 fork 하지 않는다**. 따라서 환경 생성은 **Railway GUI 에서 prod 복제** → `terraform import` 로 state 흡수하는 경로로 확정. 복제가 모든 변수·TCP proxy·volume 을 함께 가져오므로, 변수는 **완전 SSOT** 로 전부 import 한다(`infra/railway/scripts/import-dev.sh`).

### 거부된 대안

- **Approach B — 별도 Railway 프로젝트**: provider 제약을 우회하나 ADR-0009 amend 와 큰 폭의 구조 변경 필요. provider 리서치 전엔 추천했으나, GUI 1회 수동이 기존 volume 패턴과 일관됨을 확인 후 폐기.
- **wertlex 포크 도입**: abandoned 포크에 staging BE 호스팅 종속 — Railway API 변경 시 수습 주체 부재.

### 왜 GUI shadow override 가 안전한가

`railway_service.api.source_repo_branch` 는 TF 가 프로젝트 레벨 service 의 기본 브랜치로 인식하는 값. Railway GUI 에서 staging environment 의 service 인스턴스에 branch override 를 설정하면 그 override 는 Railway 내부의 env-scoped service override 모델에 저장되며 **TF state 에 표현되지 않는다**. → TF plan 이 drift 로 잡지 않음. "TF 시야 밖" 패턴이라 안전.

## 3. 변경 범위

### 3.1 선언적으로 추가되는 것

- **Railway**: 같은 프로젝트에 새 `staging` environment 1 + staging 스코프 변수 셋(postgres·api 합쳐 ~20개, 대부분 prod 값과 동일하고 시크릿·spring profile·SENTRY_ENVIRONMENT·S3 버킷명만 분리) + staging 용 Railway 생성 도메인 1 + 외부 접근용 TCP proxy 1
- **AWS**: staging 전용 S3 버킷 1 + 기존 IAM 정책의 S3 접근 권한을 staging 버킷 ARN 까지 확장 (같은 IAM 유저 공유)
- **변경 없음**: 기존 prod Railway 리소스, 기존 모듈 provider 설정, 기존 root 모듈 호출 구조 — 전부 손대지 않는다. 모든 변경은 **순수 추가형**.

### 3.2 1회성 manual step (Railway GUI)

`terraform apply` 후:

1. `staging` environment → `api` 서비스 → source branch override 를 `dev` 로 설정
2. `staging` environment → `postgres` 서비스의 volume 생성 (Railway 볼륨은 env 별 분리, 기존 prod 패턴 동일)

두 단계 모두 module README 에 기존 volume 주석과 동일 톤으로 문서화.

## 4. 격리/공유 매트릭스

| 항목                        | staging                                     | 근거                                               |
| --------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Railway 프로젝트            | 공유 (`morton`)                             | ADR-0009                                           |
| Railway environment         | **별도** (이름 `dev`)                       | ADR-0009 + ADR-0010                                |
| Postgres DB (인스턴스)      | **별도** (staging env 의 postgres 인스턴스) | 데이터 격리                                        |
| git 브랜치                  | **`dev`** (Railway GUI 1회 수동)            | provider 제약 + ADR-0010                           |
| `db_password`, `jwt_secret` | **별도** (staging 전용 시크릿)              | 보안                                               |
| S3 버킷                     | **별도** (staging 전용 버킷)                | 사용자 결정 — 테스트 파일이 prod 에 안 섞임        |
| Spring 프로파일             | **`prod` 재사용** (전용 프로파일 BE 후속)   | §6 정정 — dev 프로파일 부재 시 datasource 미설정   |
| Sentry DSN                  | 공유                                        | 같은 프로젝트, `SENTRY_ENVIRONMENT=staging` 태그   |
| AWS IAM 자격증명            | 공유                                        | 같은 유저가 두 버킷 접근                           |
| Solapi (SMS)                | **공유**                                    | 사용자 결정 — staging OTP 로그인 실 동작 ⚠️ 실 SMS |
| 도메인                      | Railway 생성 도메인                         | 사용자 결정 — DNS 작업 0                           |

## 5. ADR-0009 와의 관계

ADR-0009 의 결정("같은 프로젝트 별도 environment")이 그대로 유지됨 → **amend 불필요**. ADR-0009 의 Related 에 본 spec forward-link 만 추가하여 구현 세부(provider 제약 + GUI 수동 단계)를 추적 가능하게 연결.

## 6. 후속 의존성 (#351 범위 밖)

- **BE `application-staging.yml`** — `SPRING_PROFILES_ACTIVE` 전용 프로파일. CEO 작업 — [#353](https://github.com/mortonCareer/bconnect/issues/353) 에 묶거나 신규 이슈.

  > **구현 시 정정 (2026-06-01)**: 초안의 "프로파일 없으면 fallback 가능, 부팅됨" 은 **부정확**. datasource(url/user/pw) 와이어링이 `application-prod.yaml` 에만 있고 base `application.yaml` 엔 없어, `dev`/`staging` 프로파일 부재 시 base fallback → **datasource 미설정 → 부팅 실패**. 따라서 dev 환경은 **`SPRING_PROFILES_ACTIVE=prod` (prod 프로파일 재사용)** 으로 부팅하고, 텔레메트리만 `SENTRY_ENVIRONMENT=dev` 로 구분. 전용 `application-dev.yaml` 도입은 BE 후속에서 진행하며 **#351 은 차단되지 않음**.

- [#352](https://github.com/mortonCareer/bconnect/issues/352) — Vercel dev custom environment 에 staging BE URL 주입.
- [#353](https://github.com/mortonCareer/bconnect/issues/353) — staging BE CORS 에 dev 브랜치 도메인 허용.

## 7. 비용

staging environment 의 postgres + api 인스턴스가 상시 가동 → Railway 월 비용 추가 (prod 와 동등 수준). staging S3 버킷 사용량 비용 (미미). `terraform apply` 는 **`terraform plan` 출력을 사용자에게 보여주고 명시적 승인 후에만** 실행 (CLAUDE.md terraform 규칙 + 클라우드 비용 발생 규칙).

## 8. 검증

- `terraform plan` 결과가 **순수 추가** + 기존 IAM 정책 in-place 확장만이어야 함 — destroy/recreate 없음. 안 보장되면 plan 중단·원인 추적.
- `apply` 후: GUI manual step (§3.2) 수행 → staging env 의 api 가 dev 코드로 부팅 → Railway 생성 도메인 URL 응답 + postgres 연결.
- prod 무영향 회귀 — `api.bconnect.to` 정상.

## 9. Non-goals

- dev FE → staging BE 연결 ([#352](https://github.com/mortonCareer/bconnect/issues/352))
- staging BE CORS ([#353](https://github.com/mortonCareer/bconnect/issues/353))
- 트리거 모니터링 가시화 (사용자가 #351 후속에서 제외)
- staging CI/CD 파이프라인 변경 — Railway 가 `dev` push 에 자동 배포하므로 별도 작업 불필요
- community provider 에 `railway_deployment_trigger` 재추가 upstream 기여 — 별도 OSS 작업
