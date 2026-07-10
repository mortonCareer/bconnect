# 도메인 현황 — 서비스 × 환경 매핑

> **For**: 어떤 도메인이 어떤 서비스의 어떤 환경을 가리키는지 확인하려는 사람 또는 AI.
> **You'll be able to**: production·dev(staging)·PR 프리뷰·로컬 각 환경의 FE/BE 도메인, FE→BE 연결, 보조 서비스(DB·S3·FCM)·DNS 현황을 한눈에 lookup.

도메인 literal 의 **선언적 SSoT 는 [`infra/`](../../infra/) (Terraform)** 다. 이 문서는 그걸 사람이 읽기 쉽게 비추는 **derived view(현황 스냅샷)** — 도메인이 바뀌면 `infra/` 가 먼저 바뀌고 이 표를 갱신한다. 네이밍 **규칙·근거**는 [ADR-0016](../explanation/adr/0016-environment-service-domain-naming.md), 도구 **접근**(콘솔 링크·CLI·MCP)은 [tools.md](./tools.md).

---

## 1. 도메인 → 서비스 → 환경

| 도메인                  | 서비스               | 환경          | 프로바이더 | 비고                                       |
| ----------------------- | -------------------- | ------------- | ---------- | ------------------------------------------ |
| `bconnect.to`           | career (기술자 PWA)  | production    | Vercel     | apex. `www.bconnect.to` → apex redirect    |
| `plan.bconnect.to`      | plan (업체/건축주)   | production    | Vercel     |                                            |
| `api.bconnect.to`       | api (Spring Boot BE) | production    | Railway    | `SPRING_PROFILES_ACTIVE=prod`              |
| `dev.bconnect.to`       | career               | dev (staging) | Vercel     | `dev` 브랜치 자동배포 (Vercel custom env)  |
| `plan.dev.bconnect.to`  | plan                 | dev (staging) | Vercel     | `dev` 브랜치 자동배포. 2-레벨 서브도메인   |
| `api.dev.bconnect.to`   | api                  | dev (staging) | Railway    | Railway `dev` 환경. Sentry env 태그 `dev`  |
| `*.vercel.app`          | career / plan        | PR 프리뷰     | Vercel     | `<project>-git-<branch>-<team>.vercel.app` |
| `localhost:3000 / 3001` | career / plan        | 로컬          | —          | `pnpm dev:career` / `pnpm dev:plan`        |
| `localhost:8080`        | api                  | 로컬          | —          | `./gradlew bootRun`                        |

규칙: **`{service}.{env}.bconnect.to`** — production 은 `{env}` 생략, career 는 apex 라 `{service}` 생략 ([ADR-0016](../explanation/adr/0016-environment-service-domain-naming.md)). 새 환경·서비스는 같은 규칙으로 확장.

선언 위치: Vercel 도메인 [`infra/vercel/projects.tf`](../../infra/vercel/projects.tf) · Railway 도메인 [`infra/railway/spring.tf`](../../infra/railway/spring.tf), [`infra/railway/dev.tf`](../../infra/railway/dev.tf).

---

## 2. 서비스별 환경 (한눈에)

| 서비스      | production         | dev (staging)          | 로컬             |
| ----------- | ------------------ | ---------------------- | ---------------- |
| career (FE) | `bconnect.to`      | `dev.bconnect.to`      | `localhost:3000` |
| plan (FE)   | `plan.bconnect.to` | `plan.dev.bconnect.to` | `localhost:3001` |
| api (BE)    | `api.bconnect.to`  | `api.dev.bconnect.to`  | `localhost:8080` |

production = `main` 브랜치, dev(staging) = `dev` 브랜치 추적. PR 프리뷰는 브랜치별 `*.vercel.app` (배포 절차: [deployment.md](../how-to/deployment.md)).

---

## 3. FE → BE 연결 (`NEXT_PUBLIC_API_URL`)

| FE 환경                       | 호출 대상 API                 | 비고                                                                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| production (`bconnect.to` 등) | `https://api.bconnect.to`     |                                                                                                             |
| dev (`dev.bconnect.to` 등)    | `https://api.dev.bconnect.to` | Vercel `dev` custom env override, `NEXT_PUBLIC_API_MOCKING=disabled` → 실제 staging BE                      |
| PR 프리뷰 (`*.vercel.app`)    | MSW mock 기본                 | 상세: [development-workflow.md](../how-to/development-workflow.md), [packages/mocks](../../packages/mocks/) |
| 로컬                          | `http://localhost:8080`       | [`packages/api-client/src/client.ts`](../../packages/api-client/src/client.ts) fallback                     |

값 선언: [`infra/vercel/projects.tf`](../../infra/vercel/projects.tf) (`career_api_url`/`plan_api_url` + `*_dev_api_url`), 스키마 검증은 [`packages/config/env/validate.ts`](../../packages/config/env/validate.ts).

---

## 4. 보조 서비스 (도메인 없음, 식별자만)

| 서비스             | production                                                     | dev (staging)                           | 프로바이더 | 선언 위치                                                                                                            |
| ------------------ | -------------------------------------------------------------- | --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Postgres (DB)      | Railway 내부 private domain (앱) + 외부 TCP proxy (Vercel·GHA) | dev 환경 분리 (별도 password·TCP proxy) | Railway    | [`infra/railway/database.tf`](../../infra/railway/database.tf), [`infra/railway/dev.tf`](../../infra/railway/dev.tf) |
| 파일 스토리지 (S3) | `morton-storage`                                               | `morton-storage-dev`                    | AWS        | [`infra/aws/storage.tf`](../../infra/aws/storage.tf)                                                                 |
| Web Push (FCM)     | Firebase 프로젝트 `bconnect-f0bee` (career·plan web app)       | 동일 프로젝트, 환경별 SDK config 주입   | Firebase   | [`infra/firebase/main.tf`](../../infra/firebase/main.tf)                                                             |

> DB 접속 문자열·password·TCP proxy host:port 등 **시크릿은 본 문서에 싣지 않는다** — `infra/` 변수(gitignored) 및 Railway 콘솔이 진실. 콘솔/CLI 접근은 [tools.md](./tools.md).

---

## 5. DNS — 가비아(Gabia) 수동 관리

DNS 레코드는 **Terraform 관리 밖**이다. 가비아는 Terraform/CLI 를 지원하지 않아 IaC 불가 ([ADR-0016](../explanation/adr/0016-environment-service-domain-naming.md) Consequences).

흐름: `infra/` 에서 Vercel/Railway 커스텀 도메인을 선언하고 `apply` → 나오는 CNAME 타겟을 **가비아 콘솔에서 수동 등록**한다.

| 도메인                 | CNAME 타겟 유형                                       |
| ---------------------- | ----------------------------------------------------- |
| `bconnect.to` / `www`  | Vercel (apex 는 A + Vercel 자동 관리)                 |
| `plan.bconnect.to`     | Vercel 생성 도메인                                    |
| `api.bconnect.to`      | Railway 생성 도메인                                   |
| `dev.bconnect.to`      | Vercel 생성 도메인 (`bconnect-career-*`)              |
| `plan.dev.bconnect.to` | Vercel 생성 도메인                                    |
| `api.dev.bconnect.to`  | Railway 생성 도메인 (`morton-api-dev.up.railway.app`) |

---

## 6. 변경 절차

도메인을 추가·변경할 때 (`infra/` 가 SSoT, 본 문서는 따라간다):

1. [`infra/`](../../infra/) 에 Vercel/Railway 리소스 선언적 추가 → `terraform apply` (MFA 필요)
2. 노출된 CNAME 타겟을 **가비아 콘솔에서 수동 등록**
