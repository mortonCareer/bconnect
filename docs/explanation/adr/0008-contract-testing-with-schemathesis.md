# ADR-0008: spec ↔ BE 정합성을 Schemathesis 로 자동 검증

- **Status**: Proposed
- **Date**: 2026-05-10
- **Deciders**: @manamana32321
- **Related**: [#325](https://github.com/mortonCareer/bconnect/pull/325), [#326](https://github.com/mortonCareer/bconnect/issues/326), [#328](https://github.com/mortonCareer/bconnect/issues/328), [ADR-0003](./0003-openapi-3-1-with-domain-split.md), [ADR-0004](./0004-api-response-envelope.md), [ADR-0006](./0006-dev-as-staging.md)

## Context

Morton 은 OpenAPI spec 을 SSoT 로 두고 FE/BE 가 비대칭으로 따라가는 모델. orval codegen 으로 FE 타입은 결정론적으로 생성되지만, BE 는 spec 을 사람이 읽고 Spring Boot 으로 손 구현 — springdoc 미사용 (ADR-0003). 결과로:

| 차원             | 자동 검증 | 검증 방식                             |
| ---------------- | --------- | ------------------------------------- |
| spec ↔ FE 정합성 | ✅        | 통합 CI: api:generate + typecheck     |
| spec ↔ BE 정합성 | ❌        | 사람 의식 (spec PR 에 fine-pine 리뷰) |

[#325](https://github.com/mortonCareer/bconnect/pull/325) release PR 사전 BE envelope 검증 중 [#326](https://github.com/mortonCareer/bconnect/issues/326) incident 발견: `GET /api/v1/credentials/types` 가 spec `security: []` 와 달리 BE 에서 `403 + empty body`. Spring `SecurityFilterChain` 이 spec 변경에 따라오지 않은 사례. 사람 의식 의존의 누수가 prod 까지 갈 뻔한 비싼 케이스.

또한 ADR-0006 의 dev = staging-like 정책에서 **dev BE 환경이 별도로 없음** — FE 는 mock 으로 검증되지만 BE 정합성은 prod (`api.bconnect.to`) 에서만 확인 가능. release 머지 시점에 prod 에서 처음 만나게 되는 위험 구조.

## Options

### Option 1: Schemathesis (외부 runtime contract test)

OpenAPI spec 을 source 로 spec 의 endpoint 를 prod BE 에 호출, 응답을 spec 과 매칭. 통합 CI 의 별도 job 으로 추가, warn-only.

- **장점**:
  - PyPI 월 3.4M 다운로드, Capital One/PayLead/Mattermost/Kiwi.com/Bumble 채택, 학술 평가 1.4-4.5x defect detection — 산업 표준
  - OpenAPI 3.x 네이티브, MIT, v4.x 활발 release (2026-05-09 기준 v4.18.1)
  - GET-only filter, rate-limit, timeout, User-Agent 모두 지원 — prod 안전 운영 가능
  - BE 영역 변경 없음 — `apps/api/` 미관여 정책 ([feedback_no_be_changes](../../../.claude/projects/)) 부합
- **단점**:
  - prod BE 에 직접 호출 (read-only GET 으로 부담 최소화)
  - hypothesis-based fuzz 의 false positive 가능성 — known-issues YAML 로 회피
  - "endpoint 가 spec 대로 응답하느냐" 만 검증, spec PR 자체의 breaking change 는 못 잡음 → oasdiff 보조 필요

### Option 2: Atlassian swagger-request-validator (BE 영역 도입)

Spring Boot 의 MockMvc 와 결합, BE unit test 에서 자동으로 spec compliance 검증.

- **장점**: 결정론적, prod 부담 0, fast feedback
- **단점**: **BE 코드 변경 강제** — `apps/api/` 미관여 정책상 AI/CTO 도입 불가. fine-pine 의 결정 영역. 본 ADR 의 결정 범위 외

### Option 3: Custom curl + jq smoke test

Shell 스크립트로 핵심 endpoint 만 호출 + ajv schema validation.

- **장점**: 의존성 0, 100% 제어
- **단점**: maintenance 본인 부담, spec 진화 시 script 도 손봐야 함, fuzz/edge case 0, 결국 도구로 대체될 자작 코드

### Option 4: 현 상태 유지 (사람 의식 only)

추가 도구 도입 없이 spec PR 에 fine-pine 리뷰만 의존.

- **장점**: 추가 인프라/도구 0
- **단점**: [#326](https://github.com/mortonCareer/bconnect/issues/326) 같은 사례 재발 — prod 발견의 비싼 비용 누적

### 그 외 검토 후 탈락

- **Dredd**: archived 2024, dead
- **Pact**: consumer-driven 모델로 spec SSoT 와 paradigm 충돌
- **Specmatic**: ThoughtWorks Trial 이지만 BE 도입 강제 (Option 2 와 동일 한계)
- **Microcks**: CNCF Sandbox 이지만 K8s 기반 mock 서버까지 도입 — over-engineered, mock 통합 시점에 재고

## Decision

**Option 1 (Schemathesis) + oasdiff 보조 layer + warn-only Phase 1** 채택.

근거:

1. **표준성 + 적합성 1순위**: 우리 가용 옵션 중 Option 2 (BE 영역) 와 함께 산업 검증된 두 패턴. Option 2 는 영역 정책상 도입 불가, Option 1 만 남음. PayLead 의 prod 운영 사례가 우리 환경 (단일 prod BE) 과 거의 동일.
2. **BE 영역 무관여 보존**: `apps/api/` 미관여 정책 유지. CI 영역만 변경.
3. **layered defense**: Schemathesis 만으론 spec PR 자체의 breaking change 못 잡음. `oasdiff` 가 spec 변경 PR 시점에서 이전 main vs PR HEAD 비교, breaking 자동 감지. GH Action 한 step 추가 비용으로 다른 layer 보완.
4. **Phase 1 = warn-only**: 도구 false positive 가능성 + #326 같은 알려진 미정렬이 즉각 release 차단으로 작동하면 도입 비용 폭증. `continue-on-error` + sticky comment 로 가시성만 확보. 2 주 또는 3 release cycle 후 회고 → strict 전환 / 폐기 결정.
5. **escape hatch**: known-issues YAML 의 `expires` 필드로 자동 만료. 영구 allowlist 패턴이 결국 noise 되는 PayLead 경험 차용.

## Consequences

### 좋은 결과

- spec 변경 시 BE 가 따라오는지 PR 시점 자동 시그널. 사람 의식 의존이 부분 해소
- [#326](https://github.com/mortonCareer/bconnect/issues/326) 같은 사고가 release 직전에 발견 (현재) → PR 시점에 발견 (도입 후) 으로 단축
- envelope overhaul ([#266](https://github.com/mortonCareer/bconnect/pull/266) 같은 큰 변경) 시 BE 응답 정렬 자동 검증, 통합 시점 risk 축소
- spec 자체의 breaking change 도 oasdiff 로 감지 — spec drift 의 다른 축 커버

### 나쁜 결과

- prod BE 에 매 PR 마다 read-only HTTP traffic. PayLead 기준 rate-limit 30/m + User-Agent 식별 + GET-only 로 prod 부담 / log noise 최소화. fine-pine 사전 합의로 의문의 traffic 알람 회피.
- false positive 가능성 (도구 자체 결함, 환경 일시 장애 등) — known-issues YAML 의 `expires` 자동 만료로 noise 누적 방지. 단 expires 갱신은 명시적 commit 필요.
- 도입 자체의 운영 부담 — workflow yaml + 2 mjs script + 2 config 파일 신규. 학습 비용 발생.
- Phase 4 (stateful workflow 검증) 까지 진화하려면 dev BE 격리 환경 필요 → ADR-0006 재검토 비용 인지.

### 중립적 결과

- BE 영역에 별도로 [Atlassian swagger-request-validator](https://bitbucket.org/atlassian/swagger-request-validator) 같은 도구가 도입되면 본 결정의 보완재로 작동. fine-pine 영역의 별도 결정.
- 한국 커뮤니티 사례 빈약 — 글로벌 OSS 검증 결과에 의존. 단 CI 자체가 단순 GH Action 추가라 운영 risk 작음.

## Notes

### Phase 진화 경로

| Phase        | 범위                                                     | enforcement           | 사전 작업                         |
| ------------ | -------------------------------------------------------- | --------------------- | --------------------------------- |
| **1** (도입) | public GET (`security: []`, 11개) + spec breaking change | warn-only             | 본 ADR + #328 PR                  |
| 1.5          | spec 의 모든 auth GET 에 401 응답 정의 추가              | (spec 작업)           | 별도 spec PR                      |
| 2            | + auth GET (test user 토큰)                              | warn → 안정화 후 차단 | test user 발급 (CEO 협의)         |
| 3            | + non-mutating POST (`/auth/otp/send` 등)                | 차단                  | rate-limit 더 보수적 (10/m)       |
| 4            | stateful workflow                                        | 차단                  | **dev BE 격리 → ADR-0006 재검토** |
| 5            | cron workflow (PR 외 BE drift 모니터링)                  | 알림 (Slack)          | 별도 workflow + 알림 채널         |

### 운영 hardening (PayLead 검증 기준)

`packages/api-client/schemathesis.toml`:

- `exclude-method`: POST/PUT/PATCH/DELETE — read-only 보장
- `rate-limit`: 30/m — prod 부담 최소
- `request-timeout`: 10s, `request-retries`: 0
- `User-Agent`: `Morton-Schemathesis-CI/1.0` — prod log 식별 가능 (fine-pine 합의 필요)

### Known-issues YAML 형식

`packages/api-client/schemathesis-known-issues.yaml`:

```yaml
- operation: 'GET /api/v1/credentials/types'
  check: status_code_conformance
  reason: 'BE SecurityFilterChain 미정렬 (#326)'
  expires: '2026-06-01'
  registered_by: '@manamana32321'
```

`expires` 자동 만료 — 만료 후 CI 가 다시 fail → fix 압박 자연 발생.

### Layered defense

| Layer | 도구               | 시점          | 역할                                   |
| ----- | ------------------ | ------------- | -------------------------------------- |
| 1     | Spectral / redocly | spec PR       | spec 자체 형식·일관성 (현재 부분 수행) |
| 2     | **oasdiff**        | spec PR       | 이전 vs PR breaking 감지               |
| 3     | **Schemathesis**   | dev → main PR | live BE ↔ spec 정합성                  |

### 회고 시점

Phase 1 도입 후 **2 주 또는 3 release cycle** 시점 (둘 중 빠른 쪽). 측정 지표:

- 발견 미정렬 건수
- fix 까지 걸린 시간
- false positive 비율
- known-issues YAML 의 expires 위반 건수 (잊혀진 ignore 검출)

회고 결과 → strict 전환 / Phase 2 확장 / 폐기 결정.

### 대안 escape hatch

미래 도구 false positive 빈도가 지나치게 높거나 prod 부담이 운영 issue 가 되면:

- 검증 빈도 축소 — PR 시점이 아닌 nightly cron (Phase 5 로 이연)
- 검증 범위 축소 — public GET 중 핵심 만 allowlist
- 폐기 — Schemathesis 제거 + Option 2 (BE 영역) 로 fine-pine 와 재논의
