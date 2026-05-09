# ADR-0001: Markdown ADR 도입

- **Status**: Accepted
- **Date**: 2026-05-08
- **Deciders**: @manamana32321
- **Related**: [#288](https://github.com/mortonCareer/bconnect/issues/288)

## Context

PR 리뷰 코멘트, Slack DM, 1:1 대화에서 내려진 시스템 디자인 결정이 시간이 지나면 사라진다. 새 합류자나 미래의 본인이 "왜 이렇게 했지?" 물어도 답을 찾지 못한다.

구체 사례 (이 ADR 작성 시점 기준):

- **단일 S3 버킷 + prefix 분리** 결정: PR 리뷰에서 합의됐으나 commit message에만 흔적, 검색 어려움
- **OpenAPI 3.1 + 도메인 분리** 결정: PR [#266](https://github.com/mortonCareer/bconnect/pull/266) 본문에 정리됐으나 GitHub 검색 의존
- **API response envelope `{success, data, error}`** 결정: 코드와 `CLAUDE.md`에는 있으나 "왜 envelope?" 근거가 없음

이런 결정들이 영구 추적 가능한 형태로 한 곳에 모이지 않으면, 다음 사람은 결정의 컨텍스트 없이 코드만 보고 "이상하다, 바꿔야겠다" 판단 → 의도하지 않은 regression 위험.

## Options

### Option 1: Markdown ADR (`docs/explanation/adr/`)

[MADR](https://adr.github.io/madr/) 형식의 짧은 markdown 파일을 git 레포에 누적. 번호 매기고 인덱스 유지.

- **장점**:
  - Git 히스토리 = 결정 변천사 (blame, log 가능)
  - PR 리뷰로 결정 자체를 검증 가능
  - 코드와 함께 진화. drift 가능성 ↓
  - AI(Claude Code)가 자동으로 컨텍스트 로드 가능
  - 외부 도구 의존 0
- **단점**:
  - 누군가 룰을 강제하지 않으면 작성 누락 가능
  - 표/링크 등 풍부한 표현은 Notion보다 약함

### Option 2: Notion 개발 문서DB

Notion에 결정 데이터베이스를 만들어 페이지 단위 기록.

- **장점**:
  - 표 / 임베드 / commenting UX 우수
  - 비기술자(디자이너, 기획)도 접근 가능
- **단점**:
  - 코드와 분리 → drift 발생 시 발견 어려움
  - AI 자동 로드 안 됨 (별도 MCP 호출 필요)
  - Git history와 끊어져 있어 결정의 검증 흔적 없음
  - Notion 의존 (서비스 종료 / 비용 증가 리스크)

### Option 3: PR description / commit message에만 기록

별도 docs 안 만들고 결정은 PR/commit에 적기.

- **장점**: 추가 작업 0
- **단점**: 검색 / 인덱싱 거의 불가능. 현재 상태가 이렇고, 그래서 이 ADR이 필요해진 것.

## Decision

**Option 1 (Markdown ADR)** 채택.

근거:

- Morton의 docs는 이미 git 레포 SSoT 정책 (`docs/how-to/write-docs.md` 4장)
- AI(Claude Code)가 docs를 자동으로 컨텍스트로 사용 — Markdown ADR이 결정 컨텍스트를 AI에 자연스럽게 전달
- Drift 방지가 docs 운영의 핵심 — 코드와 같은 git 트리 안에 두어야 PR 리뷰로 정합 검증 가능

위치: `docs/explanation/adr/` ([Diátaxis](https://diataxis.fr) "Explanation" 카테고리 일관)

형식: MADR 한국어 변형. `_template.md` 사용.

## Consequences

- **좋은 결과**:
  - 새 합류자가 "왜 X?" 질문 시 ADR 인덱스 → 해당 ADR 링크 한 번에 답
  - PR 리뷰에서 ADR 작성 여부를 체크 → 결정 누락 ↓
  - AI가 결정 컨텍스트 자동 사용 → "기존 결정과 다른 패턴 도입" 같은 실수 ↓
- **나쁜 결과**:
  - ADR 작성 부담 (한 결정당 30분-2시간) — 작은 결정에는 과부하
  - 룰 강제 메커니즘 없으면 작성 누락 가능 → 후속: PR 리뷰 체크리스트 또는 GHA 룰
- **중립적 결과**:
  - 옛 결정의 백필이 일회성 비용 — 이번 PR에서 굵직한 3개(ADR-0002, 0003, 0004) 백필. 이후는 작성 시점에만.

## Notes

- ADR을 언제 작성? `how-to/write-docs.md` 5장 ("언제 ADR 작성?") 참조
- ADR 작성 강제는 별도 follow-up 이슈 — PR 템플릿에 "ADR 필요 여부 체크" 항목 추가 검토
