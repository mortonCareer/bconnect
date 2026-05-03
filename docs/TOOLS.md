# 외부 도구 (SSoT)

코드/Terraform에 없는 외부 정보의 단일 진실. **Terraform 관리되는 항목은 infra/ 링크로 연결** (중복 작성 X). 도구 자체 정보(라이브러리, GHA workflow 등)는 코드를 SSoT로 사용.

## Terraform 선언적 관리

자세한 식별자(프로젝트명, bucket, region 등)는 각 모듈 참조.

| 도구         | 용도                      | Terraform 모듈                        | 링크                                                                                     |
| ------------ | ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Vercel**   | FE 호스팅 + PR 프리뷰     | [infra/vercel/](../infra/vercel/)     | [Morton 팀](https://vercel.com/morton-2262d67a)                                          |
| **Railway**  | BE + PostgreSQL           | [infra/railway/](../infra/railway/)   | [Production 프로젝트](https://railway.com/project/90cd6d09-4c7b-415f-b13f-3d6b6051769a?) |
| **AWS**      | 파일 스토리지 + CDN + IAM | [infra/aws/](../infra/aws/)           | [콘솔 로그인](https://morton-so.signin.aws.amazon.com/console)                           |
| **Firebase** | Web Push (FCM)            | [infra/firebase/](../infra/firebase/) | [BConnect 프로젝트](https://console.firebase.google.com/project/bconnect-f0bee/overview) |

## 외부 SaaS (Terraform 외)

| 도구       | 용도                        | 링크                                                                                                                                                                                                       | 비고                                                                                                                                                       |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub** | 코드 / 이슈 / PR / CI/CD    | [mortonCareer/bconnect](https://github.com/mortonCareer/bconnect)                                                                                                                                          | self-hosted runner: `morton-runner` (homelab K3s ARC, GitHub App ID `2985070`)                                                                             |
| **Figma**  | 디자인 + 핸드오프           | [모바일앱 design](https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS), [기획&사업](https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB), [FigJam ERD](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj) | Plan: Pro (Code Connect 보류 [#261](https://github.com/mortonCareer/bconnect/issues/261)) / 매핑 컨벤션: [packages/ui/CLAUDE.md](../packages/ui/CLAUDE.md) |
| **Notion** | 기획 / 스프린트 / 지식 KB   | TBD                                                                                                                                                                                                        | Claude 커넥터 사용                                                                                                                                         |
| **Slack**  | 일상 커뮤니케이션 + CI 알림 | TBD                                                                                                                                                                                                        | webhook: GHA secret `SLACK_WEBHOOK_URL`                                                                                                                    |
| **Sentry** | 에러 트래킹                 | [morton-2l org](https://morton-2l.sentry.io/)                                                                                                                                                              | `production`만 활성화 / Terraform 관리 미완 [#137](https://github.com/mortonCareer/bconnect/issues/137)                                                    |

## 도구 도입 / 변경 절차

1. Terraform 관리 가능한 항목 → 먼저 `infra/`에 선언적 추가, 본 문서에는 모듈 링크만
2. Terraform 외 정보 → 본 문서 갱신
3. 다른 docs/\* 또는 코드에서 도구 언급 시 본 문서 또는 Terraform 모듈 참조 (중복 작성 X)
