# Vercel 인프라

> 대상: 인프라 개발자<br>
> 학습 목표: Terraform 밖의 Vercel 배포 경로 운영 방식을 확인한다<br>
> 위치: `infra/vercel`

본 문서는 Terraform 밖 배포 경로 운영만 다룹니다. 리소스 정의는 [projects.tf](../../infra/vercel/projects.tf)를 참고합니다.

## 배포 경로

- Pro 팀은 배포에 첨부된 git 커밋 author가 팀 멤버여야 한다
- 검사는 트리거가 아니라 git 메타 기준이라 git push·deploy hook·`.git`
- `.git` 제거 후 CLI 소스 업로드만 통과한다. 리모트 빌드가 해당

- [.github/workflows/vercel-deploy.yml](../../.github/workflows/vercel-deploy.yml)
- 빌드는 Vercel 리모트에서 수행
- git push 자동배포는 `git.deploymentEnabled: false`로 꺼져 있다
- GitHub Actions secret `VERCEL_TOKEN`

## 주의사항

- `prepare`의 husky가 `.git` 없으면 exit 1
  - 워크플로가 `--build-env HUSKY=0`로 스킵
- [scripts/link-env.sh](../../scripts/link-env.sh)는 git 부재 시 조기 exit 0 가드 내장
  - git 명령 추가 시 가드 위에 두지 말 것
- deploy hook 재도입 금지
  - author 검사를 우회 못 함
  - 훅 배포도 git 메타가 붙어 BLOCKED. 실측
