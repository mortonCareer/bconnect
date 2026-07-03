# Vercel Infrastructure

Morton 프론트엔드(career·plan) Vercel 프로젝트를 Terraform으로 관리합니다.

## 구성요소

| 리소스           | 설명                                                       |
| ---------------- | ---------------------------------------------------------- |
| `morton-career`  | career 앱 (root: `apps/career`, production branch: `main`) |
| `morton-plan`    | plan 앱 (root: `apps/plan`, production branch: `main`)     |
| custom env `dev` | `dev` 브랜치 추적 — staging 역할 (프로젝트별 1개)          |

## 배포 트리거 — Deploy Hook (TF 시야 밖)

Pro 팀은 git push 배포 시 **커밋 author가 팀 멤버**여야 한다(시트 과금 $20/mo/seat, [#685](https://github.com/mortonCareer/bconnect/issues/685)에서 auto-join 비활성). 멤버 승격 없이 배포하기 위해 실배포는 **deploy hook**([author 검사 없음](https://vercel.com/docs/deploy-hooks))이 담당한다 ([#707](https://github.com/mortonCareer/bconnect/issues/707)).

- 트리거: [`.github/workflows/vercel-deploy.yml`](../../.github/workflows/vercel-deploy.yml) — dev/main push 시 브랜치별 훅 curl
- 훅 URL 저장: GitHub Actions secrets (`VERCEL_DEPLOY_HOOK_{CAREER,PLAN}_{DEV,MAIN}`)
- dev 브랜치 훅 배포는 custom environment `dev`로 자동 라우팅됨 (branch tracking, 실측 확인)

### 훅 생성/재발급 (Terraform provider 미지원 → CLI 원샷)

```bash
TOKEN=<infra/terraform.tfvars의 vercel_api_token>
for proj in morton-career morton-plan; do
  for ref in dev main; do
    npx -y vercel@latest deploy-hooks create "gha-$ref" \
      --ref "$ref" --project "$proj" --scope morton-so --token "$TOKEN"
  done
done
# 출력된 URL을 gh secret set VERCEL_DEPLOY_HOOK_..._{DEV,MAIN} 으로 갱신
# 조회: npx vercel deploy-hooks ls --project <proj> --scope morton-so --token $TOKEN
```

### 주의 — 하지 말 것

- **`vercel.json`에 `git.deploymentEnabled: false` 금지** — git push 자동배포뿐 아니라 **deploy hook까지 비활성화**된다 ([vercel/community#286](https://github.com/vercel/community/discussions/286) 실측). 비멤버 author 푸시가 남기는 BLOCKED 배포 엔트리는 무해한 노이즈로 현상 유지가 맞다.
- `preview_deployments_disabled = true`(ADR-0022) 상태에서 dev/main 외 브랜치 훅은 **조용히 무시**된다(잡은 PENDING 응답, 배포 미생성 — 실측). 훅은 dev/main에만 만들 것.

## 사용 방법

```bash
cd infra
terraform plan
```

apply 절차(MFA 세션 포함)는 [deployment.md](../../docs/how-to/deployment.md) 및 morton-terraform 스킬 참조.
