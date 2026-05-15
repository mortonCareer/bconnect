# Railway Staging 환경 프로비저닝 설계

> **For**: [#351](https://github.com/mortonCareer/bconnect/issues/351) 구현자, ADR-0009 amend 리뷰어, staging 인프라를 이해하려는 개발자.
> **You'll be able to**: Railway staging 프로젝트를 Terraform으로 어떻게 구성하는지, 왜 "별도 프로젝트" 구조인지, prod와 무엇을 격리/공유하는지 파악한다.

- **Related**: [#351](https://github.com/mortonCareer/bconnect/issues/351), [ADR-0009](../../explanation/adr/0009-be-db-hosting-railway-staging.md) (amend 대상), [ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md), [#352](https://github.com/mortonCareer/bconnect/issues/352), [#353](https://github.com/mortonCareer/bconnect/issues/353)
- **Status**: 승인됨 (2026-05-15, brainstorming)

## 1. 배경

[ADR-0009](../../explanation/adr/0009-be-db-hosting-railway-staging.md)는 "Railway 유지 + BE+DB staging 환경 추가"를 결정하고, staging을 **"같은 프로젝트 내 별도 environment"**로 두기로 했다 (Option 3 "별도 프로젝트"는 명시적으로 거부).

[ADR-0010](../../explanation/adr/0010-dev-branch-staging-be.md)는 dev 브랜치 FE가 staging BE를 호출하도록 결정했다. #351 구현 단계에서 "staging BE는 어떤 git 브랜치를 배포하나?"를 확정: **`dev` 브랜치 자동 추적** — dev FE와 staging BE가 같은 dev 코드를 돌려야 통합 검증이 의미를 가짐.

### 발견된 제약

`infra/railway/`는 `terraform-community-providers/railway` v0.6.x를 사용한다. 이 provider의 `railway_service` 리소스는:

- `environment_id`를 받지 않는다 — **프로젝트 전역**
- `source_repo_branch`가 **단일 값** — 한 서비스가 환경별로 다른 브랜치를 추적 불가
- `railway_service_instance` 같은 환경별 오버라이드 리소스 없음 (v0.6.2 최신 확인)

환경별로 달라질 수 있는 건 `railway_variable`(service×env) / `railway_custom_domain` / `railway_service_domain` / `railway_tcp_proxy`뿐.

→ **ADR-0009의 "같은 프로젝트 별도 environment"로는 staging이 `dev` 브랜치를 추적할 수 없다.** 같은 `railway_service.api`를 공유하면 prod와 staging이 같은 브랜치를 배포하게 된다.

## 2. 결정 — Approach B: 별도 Railway 프로젝트

staging을 **별도 Railway 프로젝트 `morton-staging`**으로 구성한다. 이 provider는 "프로젝트 = 단일 배포 타깃 = 단일 브랜치"로 모델링하므로, 두 브랜치를 돌리는 TF-native한 방법은 두 프로젝트다.

`infra/railway/`는 이미 거의 모든 설정을 변수로 받는 재사용 가능한 모듈이다. 따라서 핵심 구현은 **이 모듈을 `infra/main.tf`에서 한 번 더 호출**하는 것 + 모듈을 다중 인스턴스화 가능하게 만드는 소규모 정리.

### 거부된 대안

- **Approach A** (같은 프로젝트 + staging environment + staging 전용 서비스): ADR-0009의 "같은 프로젝트" 문구는 지키나, Railway service가 project-scoped라 `api_staging`/`postgres_staging`가 prod environment에도 미설정 상태로 나타나는 cosmetic 노이즈. "environment"를 쓰지만 서비스는 env 간 공유 안 하는 어정쩡한 형태.
- **Approach C** (같은 프로젝트, 브랜치만 GUI 수동): "선언적 관리" 원칙 위반.

## 3. 아키텍처 — 파일 변경

### 3.1 `infra/railway/` 모듈 정리 (다중 인스턴스화 가능하게)

| 파일                        | 변경                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main.tf`                   | `provider "railway"` 블록 **제거** (루트로 이동) — Terraform은 다중 인스턴스화되는 모듈에 provider 블록을 두는 것을 권장하지 않음. `terraform { required_providers }`만 유지.                          |
| `variables.tf`              | `railway_token` 변수 **제거** (provider가 루트에서 상속). `sentry_environment` 변수 **추가**. 도메인 처리 변수 **추가** — `api_domain` (값 있으면 custom domain, 빈 문자열이면 service domain).        |
| `spring.tf`                 | `SENTRY_ENVIRONMENT` 값 `"production"` → `var.sentry_environment`. `railway_custom_domain.api`를 `count`로 조건부 (`api_domain != ""`), `railway_service_domain.api` 조건부 추가 (`api_domain == ""`). |
| `outputs.tf`                | `api_domain` 출력을 인스턴스별 실제 URL로 (custom domain 또는 service domain 생성값).                                                                                                                  |
| `project.tf`, `database.tf` | **변경 없음** — 모듈 인스턴스가 격리되므로 `railway_project.morton`(name=`var.project_name`)·postgres·tcp_proxy가 그대로 두 번 생성됨.                                                                 |

`railway_service_domain.api`의 `subdomain`은 `"${var.project_name}-api"`로 도출 (staging → `morton-staging-api.up.railway.app`).

> ⚠️ **state mv 선처리 필요**: `railway_custom_domain.api`에 `count`를 추가하면 주소가 `...api` → `...api[0]`으로 바뀌어 Terraform이 destroy+recreate로 인식 → prod `api.bconnect.to` 순간 장애 위험. `apply` 전에 `terraform state mv 'module.railway.railway_custom_domain.api' 'module.railway.railway_custom_domain.api[0]'` 실행하고 PR 본문에 기록 (CLAUDE.md: single-state 환경은 state mv 우선).

### 3.2 `infra/main.tf` (루트)

- `provider "railway" { token = var.railway_token }` **추가** (루트로 이동)
- `module "railway"` (prod) — `railway_token` 인자 제거, `sentry_environment = "production"` + `api_domain = "api.${var.domain}"` 추가
- `module "railway_staging"` **신규**:

  | 인자                                          | 값                            | 비고                          |
  | --------------------------------------------- | ----------------------------- | ----------------------------- |
  | `project_name`                                | `"morton-staging"`            |                               |
  | `github_repo`                                 | `var.github_repo`             | 동일                          |
  | `github_branch`                               | `"dev"`                       | ← 핵심                        |
  | `db_user` / `db_name`                         | `var.db_user` / `var.db_name` | 동일 (별도 프로젝트라 무충돌) |
  | `db_password`                                 | `var.staging_db_password`     | ← 격리                        |
  | `spring_profile`                              | `"staging"`                   | ← 격리                        |
  | `jwt_secret`                                  | `var.staging_jwt_secret`      | ← 격리                        |
  | `aws_access_key_id` / `aws_secret_access_key` | `module.aws.*`                | 공유                          |
  | `s3_bucket_name`                              | `var.staging_s3_bucket_name`  | ← 별도 버킷                   |
  | `sentry_dsn`                                  | `var.sentry_dsn`              | 공유 (DSN 동일)               |
  | `sentry_environment`                          | `"staging"`                   | ← 태그 분리                   |
  | `solapi_*`                                    | `var.solapi_*`                | 공유 (의도적 — 5절 참조)      |
  | `api_domain`                                  | `""`                          | → service domain              |

### 3.3 `infra/aws/` — staging S3 버킷

| 파일                 | 변경                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `storage.tf`         | `aws_s3_bucket.app_storage_staging` 추가 (`bucket = var.staging_s3_bucket_name`)                                                          |
| `iam.tf`             | `aws_iam_policy.app_access`의 `S3Access` statement `Resource`에 staging 버킷 ARN 2개 추가 — 같은 `morton-app-storage-user`가 두 버킷 접근 |
| `variables.tf` (aws) | `staging_s3_bucket_name` 변수 추가                                                                                                        |
| `main.tf` (루트)     | `module "aws"`에 `staging_s3_bucket_name` 전달                                                                                            |

### 3.4 루트 `infra/variables.tf` + `terraform.tfvars.example`

신규 변수: `staging_db_password` (sensitive), `staging_jwt_secret` (sensitive), `staging_s3_bucket_name`. tfvars.example에 placeholder 값 추가.

## 4. 생성되는 리소스

`module.railway_staging`:

- `railway_project` "morton-staging"
- `railway_service` postgres + volume + `railway_tcp_proxy` + 변수 3 (POSTGRES_USER/PASSWORD/DB)
- `railway_service` api (`source_repo_branch = "dev"`, `root_directory = "apps/api"`) + 변수 16 + `railway_service_domain`

`infra/aws/`:

- `aws_s3_bucket` staging 버킷 (신규)
- `aws_iam_policy.app_access` (기존 갱신 — 신규 리소스 아님)

전부 단일 state(`morton-terraform-state`)에 추가.

## 5. 격리/공유 매트릭스

| 항목                        | staging                                        | 근거                                                                                                 |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Railway 프로젝트            | **별도** (`morton-staging`)                    | provider 제약 (브랜치 추적)                                                                          |
| Postgres DB                 | **별도** (staging 프로젝트 내)                 | 데이터 격리                                                                                          |
| `db_password`, `jwt_secret` | **별도** (`staging_*` 변수)                    | 보안                                                                                                 |
| git 브랜치                  | **`dev`** (prod는 `main`)                      | ADR-0010 통합 검증 의도                                                                              |
| S3 버킷                     | **별도** (`morton-staging` 버킷)               | 사용자 결정 — 테스트 파일이 prod에 안 섞임                                                           |
| Spring 프로파일             | **`staging`**                                  | 사용자 결정 — staging 전용 BE 설정 여지 (7절 BE 의존성 참조)                                         |
| Sentry DSN                  | 공유                                           | 같은 프로젝트, `SENTRY_ENVIRONMENT=staging` 태그로 분리                                              |
| AWS IAM 자격증명            | 공유 (`morton-app-storage-user`)               | 같은 유저가 두 버킷 접근                                                                             |
| Solapi (SMS)                | **공유**                                       | 사용자 결정 — staging OTP 로그인이 실제 동작. ⚠️ staging 테스트가 실 SMS 발송 → QA 시 본인 번호 사용 |
| 도메인                      | Railway 생성 도메인 (`railway_service_domain`) | 사용자 결정 — DNS 작업 0                                                                             |

## 6. ADR-0009 Amendment

ADR-0009는 "같은 프로젝트 별도 environment"를 채택하고 "별도 프로젝트"(Option 3)를 거부했다. #351 구현 중 발견한 provider 제약(`railway_service` 브랜치 = 프로젝트 전역)이 그 토폴로지 결정을 뒤집는다.

ADR-0009의 **핵심 결정**(Railway 유지 + staging 추가 + 스케일·비용 트리거까지 AWS 보류)은 **유효**하다. 바뀌는 건 staging의 **토폴로지** 하위 결정뿐 — 따라서 supersede가 아닌 **amend**:

- ADR-0009 Status는 `Accepted` 유지
- 메타데이터 블록 바로 아래에 blockquote amendment 노트 추가 (ADR-0007 supersede 노트와 동일 위치·형식): "2026-05-15: #351 구현 중 `terraform-community-providers/railway` v0.6의 `railway_service` 브랜치가 프로젝트 전역임을 발견 → '같은 프로젝트 별도 environment'로는 staging의 `dev` 브랜치 추적 불가. staging을 별도 프로젝트(`morton-staging`)로 변경. 본 ADR의 핵심(Railway 유지 + staging)은 유효." + 이 spec forward-link
- Related에 #351 + 이 spec 링크 추가

이 amend는 #351 PR에 함께 포함한다.

## 7. 후속 의존성 (#351 범위 밖)

- **BE `application-staging.yml`** — `SPRING_PROFILES_ACTIVE=staging`이 가리킬 Spring 프로파일. 없으면 Spring Boot가 `application.yml` + 환경변수로 fallback (부팅은 되나 staging 전용 설정 부재). CEO 작업 — [#353](https://github.com/mortonCareer/bconnect/issues/353)에 묶거나 신규 이슈. **#351 자체는 이 의존성에 차단되지 않음** (fallback 부팅).
- [#352](https://github.com/mortonCareer/bconnect/issues/352) — Vercel dev custom environment에 staging BE URL(`railway_service_domain` 생성값) 주입.
- [#353](https://github.com/mortonCareer/bconnect/issues/353) — staging BE CORS에 dev 브랜치 도메인 허용.

## 8. 비용

staging Railway 프로젝트 = Postgres + API 서비스 상시 가동 → Railway 월 비용 추가. staging S3 버킷 = 사용량 비용(미미). `terraform apply`는 **`terraform plan` 출력을 사용자에게 보여주고 명시적 승인 후에만** 실행 (CLAUDE.md terraform 규칙 + 클라우드 비용 발생 규칙).

## 9. 검증

- `terraform validate` + `terraform plan` — 신규 리소스(staging 프로젝트, 서비스 2개, 변수, S3 버킷, IAM 정책 갱신)가 의도대로 잡히고, **기존 prod 리소스가 변경/파괴되지 않는지** 확인:
  - `provider "railway"` 모듈→루트 이동이 리소스 churn을 일으키지 않는지
  - `railway_custom_domain.api` → `[0]` 주소 변경에 대한 state mv 선처리 후 plan에 destroy/recreate가 없는지 (3.1절 ⚠️)
- `apply` 후: staging 프로젝트 Railway 대시보드 확인, api 서비스가 `dev` 브랜치로 배포·부팅, postgres 연결, `railway_service_domain` URL 응답
- prod 무영향 회귀 — `api.bconnect.to` 정상 응답

## 10. Non-goals

- dev FE → staging BE 연결 ([#352](https://github.com/mortonCareer/bconnect/issues/352))
- staging BE CORS ([#353](https://github.com/mortonCareer/bconnect/issues/353))
- 트리거 모니터링 가시화 (사용자가 #351 후속에서 제외)
- staging CI/CD 파이프라인 변경 — Railway가 `dev` push에 자동 배포하므로 별도 작업 불필요
