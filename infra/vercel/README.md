# Vercel — 배포 운영

리소스 정의는 [projects.tf](./projects.tf)가 SSOT. 이 문서는 Terraform 밖 배포 경로 운영만 다룬다.

## 배포 경로 — CLI 소스 업로드 (git 메타 제거)

Pro 팀은 **배포에 첨부된 git 커밋 author가 팀 멤버**여야 한다(시트 과금 $20/mo/seat, [#685](https://github.com/mortonCareer/bconnect/issues/685)에서 auto-join 비활성). 검사는 트리거가 아니라 **git 메타 기준**이라 git push·deploy hook·`.git` 포함 CLI 배포 전부 BLOCKED — `.git` 제거 후 CLI 소스 업로드(리모트 빌드)만 통과한다 ([#707](https://github.com/mortonCareer/bconnect/issues/707) 실측).

- 트리거: [`.github/workflows/vercel-deploy.yml`](../../.github/workflows/vercel-deploy.yml) — dev/main push 시 checkout → `rm -rf .git` → `vercel deploy --target={dev|production}`
- 토큰: GitHub Actions secret `VERCEL_TOKEN` (= [terraform.tfvars](../terraform.tfvars)의 `vercel_api_token`, 공용계정 morton.career 소유)
- 빌드는 Vercel 리모트에서 수행 — 프로젝트 env/설정은 서버측 적용이라 CI에서 env pull 불필요
- `git.deploymentEnabled: false`(각 앱 vercel.json)로 git push 자동배포는 꺼져 있음 — 비멤버 author BLOCKED 노이즈 제거. CLI 업로드 배포는 이 플래그와 무관 (실측)

## gitless 빌드 함정 (재발 방지)

- `prepare`의 husky가 `.git` 없으면 exit 1 → 워크플로가 `--build-env HUSKY=0`로 스킵
- [scripts/link-env.sh](../../scripts/link-env.sh)는 git 부재 시 조기 exit 0 가드 내장 — git 명령 추가 시 가드 위에 두지 말 것
- **deploy hook 재도입 금지** — author 검사를 우회 못 함(훅 배포도 git 메타가 붙어 BLOCKED, 실측). [vercel/community#286](https://github.com/vercel/community/discussions/286)의 훅 우회설은 현 Pro 팀 정책에서 무효
