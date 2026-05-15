# Railway Staging 환경 프로비저닝 설계

> **For**: [#351](https://github.com/mortonCareer/bconnect/issues/351) 구현자, staging 인프라 리뷰어, ADR-0009를 참조하는 미래 합류자.
> **You'll be able to**: ADR-0009의 "같은 프로젝트 별도 environment" 결정을 community provider 제약 아래 어떻게 구현하는지, 환경별 브랜치 분기를 왜·어떻게 1회성 GUI 수동 단계로 처리하는지 파악한다.

- **Related**: [#351](https://github.com/mortonCareer/bconnect/issues/351), [ADR-0009](../../explanation/adr/0009-be-db-hosting-railway-staging.md), [ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md), [#352](https://github.com/mortonCareer/bconnect/issues/352), [#353](https://github.com/mortonCareer/bconnect/issues/353)
- **Status**: 승인됨 (2026-05-15, brainstorming — provider 리서치 후 spec 재작성. 이전 안 "별도 프로젝트(Approach B)"는 wertlex 포크의 `railway_deployment_trigger` 발견 + community provider의 의도적 제거 이력 + Morton의 기존 "volume = GUI 수동 + 주석" 패턴을 종합하여 재검토 후 폐기.)

## 1. 배경

[ADR-0009](../../explanation/adr/0009-be-db-hosting-railway-staging.md) 의 결정: Railway 유지 + BE+DB staging 환경 추가 + **"같은 프로젝트 내 별도 environment"**. [ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md) 이 dev 브랜치 FE → staging BE 통합을 결정. #351 단계에서 staging BE가 `dev` 브랜치를 추적해야 함을 확정.

### Provider 리서치 결과

`infra/railway/` 는 `terraform-community-providers/terraform-provider-railway` v0.6.2 를 사용한다. 환경별 브랜치 분기는 Railway *제품*은 GUI 로 지원하지만, **현 community provider 는 그 기능을 declarative 로 노출하지 않는다**:

- 과거에 `railway_deployment_trigger` 리소스(branch + environment_id + service_id)가 PR #12 로 추가됐다가, 커밋 [`9f6d96b`](https://github.com/terraform-community-providers/terraform-provider-railway/commit/9f6d96b) (2025-03-25)로 **의도적으로 제거**됨.
- 포크 [`wertlex/terraform-provider-railway`](https://github.com/wertlex/terraform-provider-railway) (v0.4.x, abandoned, 0 stars, 마지막 push 2025-03-25 — 정확히 제거 당일)에 남아있으나 인프라 종속 위험.
- [Railway Help Station 응답](https://station.railway.com/questions/service-deployments-to-specific-environm-900a7743): Railway 직원이 "Terraform provider 는 unofficial, 우리가 유지보수 안 함, community 에 문의" — 즉 공식 declarative 경로 부재.

→ **현 provider 로는 환경별 branch 가 declarative 로 불가능**하나, Railway 제품 자체는 환경별 branch override 를 GUI 로 지원하며 **TF 는 그 override 를 drift 로 보지 않는다** (project-level service 의 branch 값만 모델링; per-env override 는 Railway 내부 모델에 별도 저장 → TF 시야 밖).

### 기존 패턴 활용

`infra/railway/database.tf` 는 이미 `# Volume 은 아직 Terraform 으로 생성 불가하여 GUI 에서 수동 생성 필요` 주석으로 **"한 항목은 Railway GUI 수동 + 주석으로 문서화"** 패턴을 받아들이고 있다. 환경별 브랜치 override 도 같은 패턴으로 처리.

## 2. 결정 — Approach A-revised

ADR-0009 의 결정대로 **같은 Railway 프로젝트 내 별도 `staging` environment** 로 구성. 환경별 브랜치 분기는 **1회성 Railway GUI 설정 + README 주석** (volume 과 동일 패턴).

### 거부된 대안

- **Approach B** (별도 프로젝트 `morton-staging`): provider 제약을 우회하나 ADR-0009 amend + 운영/청구 분리 + 모듈 다중 인스턴스화 정리(provider 루트 이동, `count` 분기, state mv) 필요 — 리스크 큰 구조 변경. provider 리서치 전엔 추천했으나, GUI 수동 1회 단계가 기존 volume 패턴과 일관됨을 확인 후 폐기.
- **wertlex 포크 도입**: abandoned 포크에 staging BE 호스팅 종속 — 운영 리스크 + Railway API 변경 시 수습 주체 부재.

### 왜 GUI 수동이 안전한가

`railway_service.api.source_repo_branch = "main"` 은 TF 가 **프로젝트 레벨 service 의 기본 브랜치**로 인식하는 값. Railway GUI 에서 staging environment 의 service 인스턴스에 branch override 를 설정해도 그 override 는 Railway 내부의 별도 모델(environment-scoped service override)에 저장되며, **TF state 에는 보이지 않는다**. → TF plan 이 drift 로 잡지 않음. 안전한 "TF 시야 밖" 패턴.

## 3. 아키텍처 — 파일 변경

### 3.1 `infra/railway/` 모듈 (순수 추가 변경 — 기존 prod 리소스 무변경)

| 파일                       | 변경                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `project.tf`               | `railway_environment.staging` **추가** (project_id = railway_project.morton.id)                                                                                                                              |
| `staging.tf` **신규**      | staging environment 전용 리소스 모음 — postgres 변수 3 + api 변수 16 (env_id = staging) + `railway_service_domain.api_staging` + `railway_tcp_proxy.postgres_staging`. `depends_on` 체이닝은 prod 패턴 따름. |
| `variables.tf`             | `staging_db_password` (sensitive), `staging_jwt_secret` (sensitive), `staging_s3_bucket_name` **추가**                                                                                                       |
| `outputs.tf`               | `staging_api_domain` (railway_service_domain 생성값), `staging_environment_id`, `staging_postgres_tcp_proxy_host`/`port` **추가**                                                                            |
| `README.md`                | "## 환경별 브랜치 설정 (Railway GUI 수동)" 섹션 추가 — volume 주석 옆에 배치                                                                                                                                 |
| `main.tf`                  | **변경 없음** (provider 그대로 — 모듈 단일 인스턴스이므로 루트 이동 불필요)                                                                                                                                  |
| `spring.tf`, `database.tf` | **변경 없음** — `SENTRY_ENVIRONMENT="production"` 하드코드도 그대로 (prod 의도된 값)                                                                                                                         |

### 3.2 `infra/main.tf` (루트)

기존 `module "railway"` 블록에 인자만 추가:

- `staging_db_password = var.staging_db_password`
- `staging_jwt_secret = var.staging_jwt_secret`
- `staging_s3_bucket_name = var.staging_s3_bucket_name`

새 module 호출 없음, provider 이동 없음.

### 3.3 `infra/aws/` — staging S3 버킷

| 파일                 | 변경                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `storage.tf`         | `aws_s3_bucket.app_storage_staging` 추가 (`bucket = var.staging_s3_bucket_name`)                                                         |
| `iam.tf`             | `aws_iam_policy.app_access` 의 S3Access statement `Resource` 에 staging 버킷 ARN 2 추가 — 같은 `morton-app-storage-user` 가 두 버킷 접근 |
| `variables.tf` (aws) | `staging_s3_bucket_name` 변수 추가                                                                                                       |
| `main.tf` (루트)     | `module "aws"` 에 `staging_s3_bucket_name = var.staging_s3_bucket_name` 전달                                                             |

### 3.4 루트 `infra/variables.tf` + `terraform.tfvars.example`

신규 변수 `staging_db_password` (sensitive), `staging_jwt_secret` (sensitive), `staging_s3_bucket_name`. tfvars.example 에 placeholder 추가.

### 3.5 1회성 manual step (Railway GUI)

`terraform apply` 후:

1. Railway 대시보드 → morton 프로젝트 → **`staging` environment** 선택
2. `api` 서비스 → Settings → Source → **Branch 를 `dev` 로 변경** (project-level 기본값 `main` 위에 환경 한정 override)
3. `postgres` 서비스의 **staging volume 을 GUI 에서 생성** (필수 — Railway 볼륨은 env 별로 분리, 기존 prod volume 과 동일 패턴 — TF `lifecycle { ignore_changes = [volume] }` 로 인해 TF 가 관리하지 않음)

세 단계 모두 `infra/railway/README.md` 의 새 섹션에 명시 (volume 주석과 동일 톤·위치).

## 4. 생성되는 리소스

`infra/railway/` 추가:

- `railway_environment.staging` × 1
- `railway_variable.*_staging` × 19 (postgres 3 + api 16, env_id = staging)
- `railway_service_domain.api_staging` × 1 (subdomain = `"morton-api-staging"` → `morton-api-staging.up.railway.app`)
- `railway_tcp_proxy.postgres_staging` × 1 (외부 접근용, env_id = staging)

`infra/aws/`: staging S3 버킷 1 + `aws_iam_policy.app_access` 갱신 (Resource 배열 확장).

**기존 prod 리소스 전혀 무변경** — `terraform plan` 은 신규 추가만 보여줘야 한다.

## 5. 격리/공유 매트릭스

| 항목                        | staging                                        | 근거                                               |
| --------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Railway 프로젝트            | **공유** (`morton`)                            | ADR-0009 — 같은 프로젝트                           |
| Railway environment         | **별도** (`staging`)                           | ADR-0009                                           |
| Postgres DB (인스턴스)      | **별도** (staging env 의 postgres 인스턴스)    | 데이터 격리                                        |
| git 브랜치                  | **`dev`** (Railway GUI 1회 수동, 3.5절)        | provider 제약 + ADR-0010                           |
| `db_password`, `jwt_secret` | **별도** (`staging_*` 변수)                    | 보안                                               |
| S3 버킷                     | **별도** (`staging_s3_bucket_name`)            | 사용자 결정 — 테스트 파일이 prod 에 안 섞임        |
| Spring 프로파일             | **`staging`** (env-scoped 변수)                | 사용자 결정 — staging 전용 BE 설정 여지            |
| Sentry DSN                  | 공유                                           | 같은 프로젝트, `SENTRY_ENVIRONMENT=staging` 태그   |
| AWS IAM 자격증명            | 공유 (`morton-app-storage-user`)               | 같은 유저가 두 버킷 접근                           |
| Solapi (SMS)                | **공유**                                       | 사용자 결정 — staging OTP 로그인 실 동작 ⚠️ 실 SMS |
| 도메인                      | Railway 생성 도메인 (`railway_service_domain`) | 사용자 결정 — DNS 작업 0                           |

## 6. ADR-0009 와의 관계

ADR-0009 의 결정("같은 프로젝트 별도 environment")이 그대로 유지됨 → **amend 불필요**. ADR-0009 의 Related 또는 Notes 에 본 spec link 만 forward-reference 로 추가하여, 구현 세부(provider 제약 + GUI 수동 단계)를 추적 가능하게 연결.

## 7. 후속 의존성 (#351 범위 밖)

- **BE `application-staging.yml`** — `SPRING_PROFILES_ACTIVE=staging` 이 가리킬 Spring 프로파일. 없으면 Spring Boot 가 `application.yml` + 환경변수로 fallback (부팅은 되나 staging 전용 설정 부재). CEO 작업 — [#353](https://github.com/mortonCareer/bconnect/issues/353) 에 묶거나 신규 이슈. **#351 자체는 이 의존성에 차단되지 않음** (fallback 부팅).
- [#352](https://github.com/mortonCareer/bconnect/issues/352) — Vercel dev custom environment 에 staging BE URL (`railway_service_domain` 생성값) 주입.
- [#353](https://github.com/mortonCareer/bconnect/issues/353) — staging BE CORS 에 dev 브랜치 도메인 허용.

## 8. 비용

staging environment 의 postgres + api 인스턴스가 상시 가동 → Railway 월 비용 추가 (prod 와 동등 수준). staging S3 버킷 사용량 비용 (미미). `terraform apply` 는 **`terraform plan` 출력을 사용자에게 보여주고 명시적 승인 후에만** 실행 (CLAUDE.md terraform 규칙 + 클라우드 비용 발생 규칙).

## 9. 검증

- `terraform validate` + `terraform plan` — **plan 결과가 순수 추가만**이어야 함:
  - `railway_environment.staging` + staging variables + staging_service_domain + staging_tcp_proxy + staging S3 bucket 생성
  - `aws_iam_policy.app_access` in-place 갱신 (Resource 배열 확장만)
  - **기존 prod 리소스에 destroy/recreate/change 없음** — 이게 안 보장되면 plan 중단하고 원인 추적
- `apply` 후:
  1. Railway 대시보드 → staging environment 생성 확인
  2. GUI 에서 api 서비스 staging env 의 branch override 를 `dev` 로 설정 (3.5절)
  3. `dev` 브랜치 push 또는 수동 redeploy → staging api 가 dev 코드로 부팅
  4. `railway_service_domain.api_staging` 의 생성된 URL 이 응답
  5. staging postgres 연결 (DATABASE_URL 환경변수 resolve)
- prod 무영향 회귀 — `api.bconnect.to` 정상 응답, prod 로그에 이상 없음

## 10. Non-goals

- dev FE → staging BE 연결 ([#352](https://github.com/mortonCareer/bconnect/issues/352))
- staging BE CORS ([#353](https://github.com/mortonCareer/bconnect/issues/353))
- 트리거 모니터링 가시화 (사용자가 #351 후속에서 제외)
- staging CI/CD 파이프라인 변경 — Railway 가 `dev` push 에 자동 배포하므로 별도 작업 불필요
- community provider 에 `railway_deployment_trigger` 재추가 upstream 기여 — 별도 OSS 작업, 본 #351 과 분리
