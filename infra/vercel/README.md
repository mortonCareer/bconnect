# Vercel — Deploy Hook 운영

리소스 정의는 [projects.tf](./projects.tf)가 SSOT. 이 문서는 Terraform 밖 수동 리소스인 **deploy hook**만 다룬다.

실배포는 deploy hook이 담당한다 — Pro 팀 git push 배포의 커밋 author 멤버 검사(시트 과금)를 우회 ([#707](https://github.com/mortonCareer/bconnect/issues/707)). 트리거는 [`.github/workflows/vercel-deploy.yml`](../../.github/workflows/vercel-deploy.yml), 배포 플로는 [deployment.md](../../docs/how-to/deployment.md) 참조.

## 훅 생성/재발급 (Terraform provider 미지원 → CLI 원샷)

```bash
TOKEN=<infra/terraform.tfvars의 vercel_api_token>
for proj in morton-career morton-plan; do
  for ref in dev main; do
    npx -y vercel@latest deploy-hooks create "gha-$ref" \
      --ref "$ref" --project "$proj" --scope morton-so --token "$TOKEN"
  done
done
# 출력된 URL을 gh secret set VERCEL_DEPLOY_HOOK_{CAREER,PLAN}_{DEV,MAIN} 으로 갱신
# 조회: npx vercel deploy-hooks ls --project <proj> --scope morton-so --token $TOKEN
```

## 주의 — 하지 말 것

- **`vercel.json`에 `git.deploymentEnabled: false` 금지** — git push 자동배포뿐 아니라 **deploy hook까지 비활성화**된다 ([vercel/community#286](https://github.com/vercel/community/discussions/286) 실측). 비멤버 author 푸시가 남기는 BLOCKED 배포 엔트리는 무해한 노이즈로 현상 유지가 맞다.
- `preview_deployments_disabled = true`(ADR-0022) 상태에서 dev/main 외 브랜치 훅은 **조용히 무시**된다(잡은 PENDING 응답, 배포 미생성 — 실측). 훅은 dev/main에만 만들 것.
