# 외부 서비스

> 대상: 전체 개발자<br>
> 학습 목표: 외부 서비스 접근 방식 · Terraform 관리 구조 확인<br>
> 위치: `infra`

## Terraform 관리 대상

### Vercel

- 사용 목적: FE 호스팅
- Terraform: [infra/vercel/](../../infra/vercel/)
- Web: [Vercel 대시보드](https://vercel.com/morton-so)
  - [Vercel bconnect-career](https://vercel.com/morton-so/bconnect-career)
  - [Vercel bconnect-plan](https://vercel.com/morton-so/bconnect-plan)
  - [Vercel bconnect-company](https://vercel.com/morton-so/bconnect-company)
- CLI: `vercel`
- MCP: [Vercel : Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp)

### Railway

- 사용 목적: BE · PostgreSQL 배포
- Terraform: [infra/railway/](../../infra/railway/)
- Web: [Railway 대시보드](https://railway.com/project/90cd6d09-4c7b-415f-b13f-3d6b6051769a?)
  - [Railway api](https://railway.com/project/90cd6d09-4c7b-415f-b13f-3d6b6051769a/service/831fe58d-b966-4af1-b517-128e205c77b3)
  - [Railway postgres](https://railway.com/project/90cd6d09-4c7b-415f-b13f-3d6b6051769a/service/1b00b504-e28e-4a58-a78c-dfbaba713fbc)
- CLI: `railway`
- MCP: -

### AWS

- 사용 목적: 클라우드 서버 · 각종 서비스
- Terraform: [infra/aws/](../../infra/aws/)
- Web: [AWS 콘솔](https://morton-so.signin.aws.amazon.com/console)
- CLI: `aws`
- MCP: -

### Firebase

- 사용 목적: 푸시 알림. FCM
- Terraform: [infra/firebase/](../../infra/firebase/)
- Web: [Firebase 콘솔](https://console.firebase.google.com/project/bconnect-f0bee/overview)
- CLI: `firebase`
- MCP: [firebase/firebase-tools](https://github.com/firebase/firebase-tools/tree/main/src/mcp)

### GCP

- 사용 목적: Firebase가 올라가는 상위 프로젝트 `bconnect-f0bee`. FCM API 활성화
- Terraform: [infra/firebase/](../../infra/firebase/)
- Web: [GCP 콘솔](https://console.cloud.google.com/home/dashboard?project=bconnect-f0bee)
- CLI: `gcloud`
- MCP: -
  - Terraform은 `gcloud auth application-default login`으로 만든 ADC를 사용. [infra-firebase.md](./infra-firebase.md) 참고

## Terraform 미관리 대상

### GitHub

- 사용 목적: 코드 · 이슈 · PR · CI/CD
- Web: [리포지토리](https://github.com/mortonCareer/bconnect)
- CLI: `gh`
- MCP: -
- 비고: self-hosted runner `morton-runner`. homelab K3s ARC, GitHub App ID `2985070`

### Figma

- 사용 목적: 기획 · 디자인
- Web
  - [디자인](https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS)
  - [기획 · 사업](https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB)
  - [개발](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj)
- CLI: -
- MCP: [Figma : Figma MCP server](https://developers.figma.com/docs/figma-mcp-server/)
- 비고: 매핑 컨벤션은 [figma-tag.md](./figma-tag.md) 참고

### Notion

- 사용 목적: 사업화 전략 · 리서치 · 기획
- Web
  - [홈페이지](https://www.notion.so/morton-so/27a965d2888b80b4961bcc07957776f8)
  - [스토리 현황](https://www.notion.so/morton-so/27a965d2888b80408424d9875a8b5f75)
  - [사업 전략](https://www.notion.so/morton-so/2dc965d2888b80568bf4d79b03fda00d)
  - [품앗이 정보공유방](https://www.notion.so/morton-so/2f9965d2888b80f39926cc2a7882efa4)
  - [인터뷰 · 설문](https://www.notion.so/morton-so/2b4965d2888b805f97f9cf409dac0439)
- CLI: -
- MCP: Claude Code에 연결됨
- 비고: -

### Slack

- 사용 목적: 일상 커뮤니케이션 · 모니터링 알림
- Web: [Slack 워크스페이스](https://app.slack.com/client/T0AARTVT3F0)
- CLI: -
- MCP: [Slack : Guide to the Slack MCP server](https://slack.com/help/articles/48855576908307-Guide-to-the-Slack-MCP-server)
- 비고: 환경변수 `SLACK_MONITORING_WEBHOOK_URL`로 연결됨

### Sentry

- 사용 목적: 모니터링
- Web: [Sentry 대시보드](https://morton-2l.sentry.io/)
  - [Sentry career](https://morton-2l.sentry.io/settings/projects/career/)
  - [Sentry api](https://morton-2l.sentry.io/settings/projects/api/)
  - plan은 예정
- CLI: `sentry-cli`
- MCP: [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp)

### Gabia

- 사용 목적: 도메인 등록 · DNS 레코드 관리
- Web: [가비아](https://www.gabia.com/)
- CLI: -
- MCP: -

### Play Console

- 사용 목적: 안드로이드 앱 배포
- Web: [Play Console 품앗이 앱](https://play.google.com/console/u/1/developers/7159232120126438751/app/4974623671193981350/app-dashboard)
- CLI: -
- MCP: -
- 비고: ABB 파일 업로드
