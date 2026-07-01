# 환경 변수 추가하기

> **For**: bconnect에 새 환경 변수(API 키, 도메인, 기능 플래그 등)를 추가하는 개발자.
> **You'll be able to**: 변수의 성격에 맞는 저장 위치를 고르고, fail-fast 검증까지 배선해 silent-fail 없이 추가한다.

새 환경 변수가 필요할 때 "어디에 무엇을 어떻게 넣는지"의 단일 출처(SSOT)다.

---

## 핵심 원칙 2가지

### 1. `.env.example`로 계약을 남긴다

실값은 gitignore되지만, **어떤 변수가 어떤 형태로 필요한지**는 `.env.example`(FE·crawler) / `terraform.tfvars.example`(infra)에 항상 남긴다. 비밀은 placeholder, `NEXT_PUBLIC_*` 공개값은 실값을 기재한다. 예시가 없으면 신규 팀원은 무엇을 채워야 할지 알 수 없다.

### 2. fail-fast — 주입 안 되면 부팅 시 즉시 터진다

기대한 변수가 없으면 런타임 중간에 `undefined`로 조용히 오작동(silent-fail)하는 대신, **애플리케이션 시작 시점에 크래시**시킨다.

- **NextJS(Career·Plan)**: [`apps/{career,plan}/src/env.ts`](../../apps/career/src/env.ts)에서 Zod 스키마로 검증. 실패 시 `throw` ([validate.ts](../../packages/config/env/validate.ts)).
- **API(Spring Boot)**: [`application.yaml`](../../apps/api/src/main/resources/application.yaml)에서 `${VAR}` placeholder. default가 없으면 미주입 시 `Could not resolve placeholder`로 부팅 실패.

---

## 어디에 넣을까 — 결정 트리

| 변수 성격                                                | 위치                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| 프로젝트 전역, 서비스 무관, **공개해도 되는** 값         | [`.envrc`](#envrc--프로젝트-전역-공개값)                          |
| 프로젝트 전역이지만 **비밀**인 값 (개인 자격증명 등)     | `.envrc.local` (gitignored, [ONBOARDING](../tutorials/ONBOARDING.md) 참조) |
| Career / Plan 앱 런타임에서 읽는 값                      | [`apps/{app}/.env` + `src/env.ts`](#nextjscareer--plan-앱-변수)  |
| API(Spring) 런타임에서 읽는 값                           | [`application.yaml`](#apispring-boot-변수)                       |
| Terraform이 리소스를 만들 때 쓰는 값                     | [`infra/variables.tf` + `terraform.tfvars`](#인프라terraform-변수) |
| 로컬 개발에서만 쓰는 값                                  | [로컬 전용](#로컬-전용-값)                                        |

배포 플랫폼(Vercel·Railway)에서 실제 주입하는 절차는 [deployment.md](./deployment.md) 참조. 도메인 literal은 [infra/](../../infra/)가 SSOT이며 현황은 [domains.md](../reference/domains.md)를 본다.

---

## `.envrc` — 프로젝트 전역 공개값

direnv가 레포 진입 시 자동 로드하는 셸 환경 변수. **git으로 추적되므로 공개해도 되는 값만** 넣는다 (예: `AWS_PROFILE`, `AWS_REGION`).

```bash
# .envrc
export AWS_PROFILE=morton-mfa
export AWS_REGION=ap-northeast-2
```

추가 후:

```bash
direnv allow
```

비밀(개인 토큰·자격증명)은 여기 넣지 않는다 → `.envrc.local`(gitignored). 배포 절차는 [ONBOARDING](../tutorials/ONBOARDING.md).

---

## NextJS(Career · Plan) 앱 변수

3단계로 추가한다. **스키마 → 예시 → 주입.**

### 1. Zod 스키마에 추가 (fail-fast 배선)

각 앱의 [`src/env.ts`](../../apps/career/src/env.ts)에 추가한다. 공통 스키마 조각은 [`@bconnect/config/env`](../../packages/config/env/validate.ts)의 `commonSchemas` 재사용.

```typescript
// apps/career/src/env.ts
const careerEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: commonSchemas.apiUrl,
  MY_NEW_VAR: z.string().min(1), // ← 추가
})
```

사용처:

```typescript
import { env } from '@/env'

const value = env.MY_NEW_VAR // 타입 안전, 검증됨
```

`process.env.MY_NEW_VAR` 직접 접근은 금지 — 검증된 `env` 객체를 쓴다.

### 2. `.env.example` 갱신

[`apps/{app}/.env.example`](../../apps/career/.env.example)에 예시를 추가한다.

```bash
# 비밀
MY_SECRET_KEY=your_secret_key_here
# NEXT_PUBLIC 공개값은 실값 기재
NEXT_PUBLIC_MY_VAR=https://real.value
```

### 3. 배포 환경에 주입

Vercel Dashboard(또는 Terraform `vercel_project_environment_variable`)에 등록한다. 상세: [deployment.md](./deployment.md).

### ⚠️ `NEXT_PUBLIC_*` 클라이언트 인라인 함정

`NEXT_PUBLIC_*`이면서 **클라이언트 번들**에서 읽어야 하는 값(예: Firebase 공개 키)은 Zod 스키마에 **넣지 않는다**. `validateEnv()`를 거치면 클라이언트에서 `process.env`가 빈 객체가 되어 `undefined`로 떨어진다. 대신 `process.env.NEXT_PUBLIC_*`를 직접 참조해 Next.js 빌드타임 인라인을 유도한다 ([career/src/env.ts NOTE](../../apps/career/src/env.ts) 참조).

- 스키마 검증(fail-fast) O: **서버에서 읽는** 값 (`NEXT_PUBLIC_API_URL` 등)
- 스키마 제외, 직접 참조: **클라이언트 번들에서 읽는** 공개값 (Firebase 등)

---

## API(Spring Boot) 변수

[`application.yaml`](../../apps/api/src/main/resources/application.yaml)에서 `${VAR}` placeholder로 주입받는다.

```yaml
app:
  jwt:
    secret: ${JWT_SECRET} # default 없음 → 미주입 시 부팅 실패 (fail-fast)
  s3:
    region: ${AWS_REGION:ap-northeast-2} # :default → 옵셔널
```

- **필수 변수**: `${VAR}` (default 미기재) — 없으면 시작 시 크래시. 이것이 API의 fail-fast다.
- **옵셔널/기본값**: `${VAR:기본값}`.

로컬 개발은 [`application-local.yaml`](../../apps/api/src/main/resources/application-local.yaml)이 더미값을 하드코딩해 별도 주입 없이 뜬다. prod 주입은 Railway 대시보드(또는 Terraform), 배포 절차는 [deployment.md](./deployment.md).

---

## 인프라(Terraform) 변수

Terraform이 리소스를 프로비저닝할 때 쓰는 값. 3곳을 함께 갱신한다.

1. **선언**: [`infra/variables.tf`](../../infra/variables.tf) (모듈별: [vercel](../../infra/vercel/), [railway](../../infra/railway/), [aws](../../infra/aws/)의 `variables.tf`)

   ```hcl
   variable "my_var" {
     description = "무엇에 쓰는지"
     type        = string
     sensitive   = true # 비밀이면
   }
   ```

2. **예시**: [`infra/terraform.tfvars.example`](../../infra/terraform.tfvars.example)에 placeholder 추가.

3. **실값**: `infra/terraform.tfvars` (gitignored)에 실값 기입.

apply 절차는 `morton-terraform` 스킬(MFA 세션 + S3 backend)을 따른다.

---

## 로컬 전용 값

로컬에서만 필요하고 배포 환경엔 넣지 않는 값:

- **FE**: `apps/{app}/.env.local` (gitignored, `.env`보다 우선).
- **API**: [`application-local.yaml`](../../apps/api/src/main/resources/application-local.yaml)의 더미값.
- **셸 전역 비밀**: `.envrc.local`.

워크트리에서 작업할 때 위 gitignored 파일들은 [`scripts/link-env.sh`](../../scripts/link-env.sh)가 `pnpm prepare` 단계에서 main 워크트리로부터 자동 심링크한다 — 워크트리마다 다시 채울 필요 없다.

---

## 시나리오별 요약

| 시나리오                                     | 위치                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| 공개, 모든 개발자, 서비스 무관               | `.envrc`                                              |
| prod·preview·dev 공통 (FE)                   | `src/env.ts` 스키마 + Vercel 전 환경                  |
| prod·preview·dev 공통 (API)                  | `application.yaml` `${VAR}` + Railway                 |
| 특정 환경에서만                              | 배포 대시보드에서 해당 환경 스코프로만 주입           |
| 특정 환경 + 특정 앱에서만                    | 해당 앱 `src/env.ts` + 그 앱 프로젝트의 해당 환경     |
| 로컬 개발 전용                               | `.env.local` / `application-local.yaml` / `.envrc.local` |
| 신규 팀원 온보딩                             | `.env.example` + [ONBOARDING](../tutorials/ONBOARDING.md) |

---

## 신규 팀원 온보딩과의 관계

`.env.example`과 이 문서가 계약이라면, 실제 비밀값 배포는 [ONBOARDING](../tutorials/ONBOARDING.md)이 다룬다 (`.envrc.local`은 Notion으로 관리). 새 비밀 변수를 추가했다면 온보딩 자료에도 반영해 신규 팀원이 막히지 않게 한다.
