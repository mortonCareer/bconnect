# 레이블 (Labels)

> **For**: 이슈/PR 작성자 (사람 + AI), 자동화.
> **You'll be able to**: 어떤 레이블을 언제 어디에 붙일지 lookup.

bconnect repo 의 모든 GitHub 레이블 SoT. 레이블 추가/변경 시 본 문서를 먼저 갱신한 뒤 [`gh label`](https://cli.github.com/manual/gh_label) 로 repo 에 동기화.

---

## 작업 범위 레이블

PR/이슈에 변경되는 영역을 표시. 한 PR/이슈에 여러 개 조합 가능.

| 레이블          | 용도                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `📋 api-spec`   | API 스펙 설계 — [packages/api-client/src/spec/](../../packages/api-client/src/spec/)                                |
| `⚙️ be`         | 백엔드 (포괄) — [apps/api/](../../apps/api/)                                                                        |
| `⚙️be:api`      | 백엔드 API 계층 — 컨트롤러/DTO/엔드포인트                                                                           |
| `⚙️be:service`  | 백엔드 서비스 로직                                                                                                  |
| `💻 fe`         | 프론트엔드 — [apps/career/](../../apps/career/), [apps/plan/](../../apps/plan/), [packages/ui/](../../packages/ui/) |
| `🎨 publishing` | 퍼블리싱 — Figma → React                                                                                            |
| `☁️ infra`      | 인프라 — Terraform, GHA, Vercel, Railway, AWS                                                                       |
| `🤖 crawler`    | 기술자 크롤러 — [apps/crawler/](../../apps/crawler/)                                                                |
| `🔧 chore`      | 설정, 문서, CI/CD, 스킬/에이전트 — [.claude/](../../.claude/), [docs/](../../docs/), root 컨벤션                    |

## 버그 레이블

`🐛 bug` **단일 레이블** + **범위 레이블 조합** 으로 표현.

| 예시                     | 의미                 |
| ------------------------ | -------------------- |
| `🐛 bug` + `💻 fe`       | 프론트엔드 버그      |
| `🐛 bug` + `⚙️be:api`    | 백엔드 API 계층 버그 |
| `🐛 bug` + `📋 api-spec` | API 스펙 자체 버그   |

> 옛 분화 (`🐛 bug:FE` / `🐛 bug:BE` / `🐛 bug:api-spec`) 는 2026-05-10 폐기.

## 자동 봇 레이블 (사람이 직접 사용 X)

| 레이블            | 생성자                             |
| ----------------- | ---------------------------------- |
| `🚨 sync-failure` | GHA 동기화/헬스체크 실패 자동 이슈 |
| `🤖 figma-drift`  | Figma drift 자동 감지 봇 이슈      |

---

## 자동 적용 규칙 (키워드 → 레이블)

이슈/PR 작성 시 다음 키워드에 다음 레이블 적용 (AI 도 동일 규칙 따름):

| 키워드                                        | 레이블                 |
| --------------------------------------------- | ---------------------- |
| API 스펙, openapi.yaml                        | `📋 api-spec`          |
| 퍼블리싱, UI 마크업, HTML                     | `🎨 publishing`        |
| Spring Boot, Java, Backend (포괄)             | `⚙️ be`                |
| BE 컨트롤러/DTO/엔드포인트                    | `⚙️be:api`             |
| BE 서비스 로직                                | `⚙️be:service`         |
| Next.js, React, Frontend                      | `💻 fe`                |
| Vercel, Railway, AWS, 인프라                  | `☁️ infra`             |
| 크롤러                                        | `🤖 crawler`           |
| 설정, 문서, CI/CD, 스킬, 에이전트, `.claude/` | `🔧 chore`             |
| 버그 (모든 유형)                              | `🐛 bug` + 범위 레이블 |

---

## 담당자/리뷰어 매핑

레이블 → 담당자/리뷰어 매핑은 [team.md](./team.md#github-작업-매핑) 참조.

## 관련 문서

- [git-workflow.md](../how-to/git-workflow.md) — 이슈/PR 워크플로
- [qa-and-testing.md](../how-to/qa-and-testing.md) — 버그 판단 기준
- [team.md](./team.md) — 담당자/리뷰어 매핑
