# 인프라 (Terraform)

`infra/` 는 bconnect 인프라의 선언적 SSOT. 모듈: `aws/`(S3·IAM), `railway/`(BE·Postgres), `firebase/`(FCM), `vercel/`(FE 배포). 루트 [main.tf](main.tf) 가 모듈 조립, state 는 S3 backend (`morton-terraform-state`).

`plan`/`apply` 는 `morton-terraform` 스킬(morton-mfa 세션)로 실행. `apply -auto-approve` 금지, `plan` 수동 승인 필수.

## 환경 키워드 — 축약형 강제

우리가 **정의/소유**하는 환경 키워드는 항상 축약형 정규값만 사용한다:

| 환경 | 정규 키워드 |
| ---- | ----------- |
| 프로덕션 | `prod` |
| 프리뷰 | `preview` |
| 개발 | `dev` |

적용 대상 (우리가 값을 정하는 곳):

- Railway 환경명 (`railway_environment.name`, 프로젝트 default 환경)
- `SENTRY_ENVIRONMENT` 값 ([railway/spring.tf](railway/spring.tf), [railway/dev.tf](railway/dev.tf), `apps/api` `application-*.yaml` 기본값)
- 리소스 라벨 (예: [firebase/main.tf](firebase/main.tf) `labels.environment`)
- 신규로 도입하는 우리 소유 env 변수/라벨/태그

`production`·`development` 같은 풀네임으로 새로 적지 말 것.

### 예외 — 외부 플랫폼이 강제하는 고정 enum (변경 금지)

아래는 우리가 정의하는 키워드가 아니라 **외부 플랫폼 API 가 강제하는 enum** 이다. 축약하면 terraform/런타임이 깨진다. 그대로 둔다:

- **Vercel** `vercel_project_environment_variable.target` = `["production","preview","development"]` ([vercel/projects.tf](vercel/projects.tf)) — Vercel API 가 이 3개 literal 만 허용
- **Node** `process.env.NODE_ENV` 비교값 `'production'`/`'development'`/`'test'` — Node 런타임 고정값 ([packages/config/env/validate.ts](../packages/config/env/validate.ts) `nodeEnv` z.enum 포함)
- **Vercel** `process.env.NEXT_PUBLIC_VERCEL_ENV` 비교값 `'production'`/`'preview'`/`'development'` — Vercel 주입값

즉 **"우리가 부르는 환경 이름" 과 "플랫폼이 주입/요구하는 환경 값" 은 다른 축**이다. 전자만 축약형으로 통일한다.

> 참고: `dev` 환경은 staging 역할을 겸한다 ([ADR-0006](../docs/explanation/adr/0006-dev-as-staging.md), [ADR-0010](../docs/explanation/adr/0010-dev-branch-staging-be.md)). 설명 문구에서 "staging" 은 역할 서술로 쓰되, 환경을 *지칭*하는 정규 키워드는 `dev`.
