# 품앗이(BConnect) 개발 문서

> **For**: Morton 팀 (CTO/CEO/디자이너), 신규 합류자, AI 협업자(Claude Code).
> **You'll be able to**: 어디에 어떤 정보가 있는지 알고, 새 docs를 쓸 때 어디에 두면 되는지 결정한다.

품앗이(BConnect)는 Morton 사에서 개발 중인 인테리어 업체-기술자 연결 구인구직 플랫폼입니다.

---

## 처음이면

신규 합류 → [`tutorials/ONBOARDING.md`](./tutorials/ONBOARDING.md) (Day 1: 계정 발급부터 첫 PR 머지까지)

---

## Diátaxis 4분할

docs는 [Diátaxis](https://diataxis.fr) 4분할로 정리됨. "지금 무슨 의도?"에 따라 카테고리 선택:

| 의도                        | 카테고리                       | 형식                 |
| --------------------------- | ------------------------------ | -------------------- |
| 처음이라 손잡고 배우고 싶다 | [tutorials/](./tutorials/)     | 학습 절차            |
| X를 어떻게 하지?            | [how-to/](./how-to/)           | 작업 레시피          |
| X의 정확한 정의/규격은?     | [reference/](./reference/)     | 사실 사전            |
| 왜 이렇게 결정했지?         | [explanation/](./explanation/) | 결정 이유 (ADR 포함) |

새 docs를 쓰기 전: [`how-to/write-docs.md`](./how-to/write-docs.md) — 작성 룰 헌법.

---

## 빠른 진입

### 개발 사이클 (이슈 → 배포)

1. [`how-to/git-workflow.md`](./how-to/git-workflow.md) — 이슈 생성 + 브랜치 + 커밋 + PR
2. [`how-to/development-workflow.md`](./how-to/development-workflow.md) — API 스펙 + 클라이언트 생성 + 병렬 개발
3. [`how-to/deployment.md`](./how-to/deployment.md) — dev → production 배포

### 사실 lookup (자주 찾는 것)

- 외부 도구: [`reference/tools.md`](./reference/tools.md) (Vercel/Railway/AWS/Firebase/GitHub/Figma/Notion/Slack/Sentry)
- 팀 구성: [`reference/team.md`](./reference/team.md)
- API spec: [`reference/specs/`](./reference/specs/)
- FCM 딥링크: [`reference/notification-deeplinks.md`](./reference/notification-deeplinks.md)

### 결정 이유 (왜 이렇게?)

- [`explanation/adr/`](./explanation/adr/) — 시스템 디자인 결정의 영구 기록 (파일명 = 번호 + 제목으로 직접 탐색)

---

## 코드 / 명령어 / 스타일

프로젝트 루트의 [`CLAUDE.md`](../CLAUDE.md):

- 프로젝트 개요 및 기술 스택
- 개발 / 빌드 / 테스트 명령어
- 코드 스타일 (TypeScript, React, Tailwind)
- 파일 네이밍, Import 순서, 컴포넌트 패턴
- 환경 변수 관리

---

## docs 운영

- **외부 도구 SSoT 룰**: [`reference/tools.md`](./reference/tools.md)가 단일 진실. 다른 docs에서는 도구명 / 참조 링크만. (작성 룰: [`how-to/write-docs.md`](./how-to/write-docs.md) 4장)
- **자동 검증**: markdownlint + lychee CI ([`.github/workflows/docs-lint.yml`](../.github/workflows/docs-lint.yml)) — 깨진 링크 / 룰 위반 PR 차단
- **CLAUDE.md 자동로드**: AI는 cwd 기준 상위 CLAUDE.md를 자동 로드. `docs/` 안에서 편집 시 [`docs/CLAUDE.md`](./CLAUDE.md)도 함께 (작성 룰 포인터).
