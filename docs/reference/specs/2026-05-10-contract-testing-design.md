# Contract Testing 도입 설계 (Phase 1)

> **For**: 통합 CI 및 spec ↔ BE 정합성 검증 작업자.
> **You'll be able to**: dev → main 통합 시점에 Schemathesis 로 spec ↔ BE 미정렬을 자동 발견하는 구조와 결정 컨텍스트 이해.

**작성일**: 2026-05-10
**관련 이슈**: [mortonCareer/bconnect#328](https://github.com/mortonCareer/bconnect/issues/328)
**관련 ADR**: [explanation/adr/0003-openapi-3-1-with-domain-split.md](../../explanation/adr/0003-openapi-3-1-with-domain-split.md), [explanation/adr/0004-api-response-envelope.md](../../explanation/adr/0004-api-response-envelope.md), [explanation/adr/0006-dev-as-staging.md](../../explanation/adr/0006-dev-as-staging.md)
**상태**: Draft (review 중) — tech-scout 검증 반영 (v2)

---

## 1. 배경

### 1.1 문제 인식

Morton 의 dev → main 통합 CI ([`.github/workflows/ci-integration.yml`](../../../.github/workflows/ci-integration.yml)) 는 **spec ↔ FE 정합성**만 자동 검증한다. `pnpm api:generate` (orval codegen) 가 spec 을 source 로 FE 타입 코드를 결정론적으로 생성하기 때문에 typecheck/build 만으로 FE 정합성이 보장된다.

반면 **spec ↔ BE 정합성**은 자동 검증 범위 밖이다. Morton 은 BE (Spring Boot) 가 springdoc/swagger 를 의도적으로 미사용 — spec 은 CTO 의 디자인 도구로 사용하고 BE 는 contract 만 참고하는 모델이다. 따라서 spec 변경 시 BE 가 따라가는 것은 **사람 의식**에 의존한다.

### 1.2 발견 경위

[mortonCareer/bconnect#325](https://github.com/mortonCareer/bconnect/pull/325) release PR 사전 BE envelope 검증 중, `/api/v1/credentials/types` 가 spec 의 `security: []` 정의와 달리 BE 에서 `403 + empty body` 반환하는 사례가 발견되어 [mortonCareer/bconnect#326](https://github.com/mortonCareer/bconnect/issues/326) follow-up 이슈로 등록되었다. 이런 미정렬은 사람 의식에 의존하면 누락 가능성이 크고, prod 배포 후 사용자가 발견하는 가장 비싼 케이스로 이어질 수 있다.

---

## 2. 목적과 범위

### Phase 1 (본 설계)

- spec 의 `security: []` GET endpoint 만 자동 검증 (현재 11 개)
- 진입 비용 최소화 — warn-only, prod 부담 최소
- 표준 도구 (Schemathesis) 채택, 유지보수 자동화
- spec 변경 PR 의 breaking change 자동 감지 (oasdiff)

### 명시적 비범위 (Phase 1)

- 인증 endpoint 검증 — Phase 2 로 이연
- BE 응답 fuzz testing — prod 부담, 가치 낮음
- spec 자체의 design quality 검증 — 사람 리뷰 영역
- BE 코드 변경 — `apps/api/` 미관여 정책
- stateful workflow 검증 (POST 후 GET 일관성 등) — Phase 4, dev BE 격리 환경 필요

---

## 3. 핵심 설계 결정 요약

| 영역          | 결정                                | 대안                  | 이유                                                      |
| ------------- | ----------------------------------- | --------------------- | --------------------------------------------------------- |
| 도구          | Schemathesis                        | Pact, Dredd, custom   | OpenAPI 3.x 네이티브, PyPI 월 3.4M, fortune-tier 채택 (★) |
| 보조 layer    | oasdiff (spec breaking change gate) | 없음                  | spec PR 자체에서 breaking 자동 감지, GH Action 10 줄      |
| 검증 범위     | public GET only (11)                | 인증 포함, write 포함 | Phase 1 최소 진입, prod 부담 최소                         |
| 트리거        | `ci-integration.yml` 별도 job       | 별도 workflow + cron  | Phase 1 단순화, cron 은 Phase 5+                          |
| 실패 정책     | warn-only (`continue-on-error`)     | strict block          | 도입 ROI 검증 후 strict 전환 결정                         |
| public 필터링 | preprocessing 스크립트              | 401 응답 정의 활용    | spec 의 401 정의 0/13 이라 활용 불가                      |
| 결과 표시     | PR sticky comment (한글, 합쇼체)    | job summary, Slack    | 외부 노출 톤 일관성, 매 commit 마다 자동 갱신             |
| 미정렬 처리   | known-issues YAML (expires 필드)    | YAML allowlist 영구   | `expires` 자동 만료로 잊혀진 ignore 누적 방지             |

(★) Schemathesis 표준성 근거: Capital One, PayLead, Mattermost, Kiwi.com, Bumble 채택. v4.x 활발 release (2026-05-10 기준 v4.18.1). 학술 평가 1.4-4.5x defect detection. 대안 verdict: Dredd archived 2024 (dead), Pact paradigm mismatch, Microcks over-engineered, Specmatic/swagger-request-validator BE 영역 강제 (도입 불가). 상세 비교는 [tech-scout 보고서](../../../.claude/plans/) 참조.

---

## 4. 시스템 구성

```
[ci-integration.yml]
    │
    ├─ integration job (기존, FE 통합 검증)
    │   ├─ install + api:generate + typecheck + build
    │   └─ release blocker
    │
    ├─ contract-test job (신규, 병렬, warn-only)
    │   ├─ install (postinstall 로 spec bundle 자동 생성)
    │   ├─ scripts/contract-extract-public.mjs
    │   │   └─ openapi.bundled.yaml → openapi.public.yaml
    │   ├─ Schemathesis run @ https://api.bconnect.to
    │   │   ├─ config: schemathesis.toml (rate-limit, timeout, exclude-method, User-Agent)
    │   │   ├─ ignore: schemathesis-known-issues.yaml (expires 필드)
    │   │   └─ checks: status_code, content_type, response_schema
    │   └─ scripts/format-contract-comment.mjs
    │       └─ Schemathesis 결과 → 한글 sticky comment
    │
    └─ spec-diff job (신규, spec 변경 시 트리거, soft fail)
        └─ oasdiff breaking @ origin/main vs PR HEAD
            └─ breaking change 감지 시 PR 코멘트 (warn-only Phase 1)
```

### 4.1 구성 요소 (단위 분리)

| 단위                                                 | 책임                                                    | 의존                               |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `ci-integration.yml`                                 | 세 job orchestration, 권한 분리                         | GitHub Actions                     |
| `scripts/contract-extract-public.mjs`                | spec preprocessing — `security: []` GET 만 추출         | `js-yaml`, `openapi.bundled.yaml`  |
| `packages/api-client/schemathesis.toml`              | Schemathesis 운영 설정 — rate-limit, timeout 등         | (정적 config)                      |
| `packages/api-client/schemathesis-known-issues.yaml` | false positive / 알려진 미정렬 등록 (expires 자동 만료) | (정적 config)                      |
| Schemathesis CLI                                     | spec ↔ live BE 검증                                     | Python 환경, `openapi.public.yaml` |
| `scripts/format-contract-comment.mjs`                | Schemathesis JSON → 한글 마크다운 포맷                  | Schemathesis report 출력           |
| `oasdiff` GitHub Action                              | spec PR 의 breaking change 감지                         | OpenAPI yaml 두 버전 (base, head)  |

각 단위는 단일 책임을 가지며 파일 입출력으로 통신한다. Schemathesis 와 oasdiff 는 외부 도구 — 변경 대상 외.

### 4.2 권한

`contract-test` 와 `spec-diff` job 은 PR sticky comment 생성을 위해 `permissions.pull-requests: write` 필요. `integration` job 은 변경 없음. 권한 최소화 원칙상 job 분리가 자연스럽다.

### 4.3 layered defense — 왜 Schemathesis 만으론 부족한가

Schemathesis 가 발견할 수 있는 것: "endpoint 가 spec 대로 응답하느냐". 다음 결함은 못 잡는다:

- **breaking change 도입** (spec PR 자체에서 응답 schema 가 호환 안 되게 변경) — `oasdiff` 가 잡음
- **endpoint 자체가 spec 에 없는데 BE 에만 있음** (또는 반대) — Schemathesis 는 spec 에 있는 것만 호출. Phase 1 범위 외
- **비즈니스 로직 결함** (필드 값이 의미상 잘못됨) — 사람 리뷰 영역

따라서 layered defense 구성:

| Layer | 도구               | 시점          | 역할                                   |
| ----- | ------------------ | ------------- | -------------------------------------- |
| 1     | Spectral / redocly | spec PR       | spec 자체 형식·일관성 (현재 부분 수행) |
| 2     | **oasdiff**        | spec PR       | 이전 vs PR breaking 감지               |
| 3     | **Schemathesis**   | dev → main PR | live BE ↔ spec 정합성                  |

---

## 5. 검증 범위 + 체크 항목

### 5.1 범위 (Phase 1)

- spec 의 `security: []` 가 명시된 GET endpoint
- 현재 audit 결과 **11 개** (`/feeds`, `/feeds/{feedId}`, `/profiles`, `/profiles/{profileId}`, `/credentials`, `/credentials/types`, `/recommendations` (received/sent), `/members` 일부, `/auth` 일부)
- preprocessing 스크립트로 동적 추출 — spec 진화에 자동 따라감

### 5.2 체크 항목

| 체크                          | 의미                                 | 채택 |
| ----------------------------- | ------------------------------------ | ---- |
| `status_code_conformance`     | 응답 status 가 spec 정의 안에 있는가 | ✅   |
| `content_type_conformance`    | Content-Type 헤더가 spec 과 일치     | ✅   |
| `response_schema_conformance` | 응답 본문이 spec 스키마와 매치       | ✅   |
| `not_a_server_error`          | 5xx 응답 거부                        | ❌   |

`not_a_server_error` 는 BE 일시 장애를 contract 위반으로 오인할 위험이 있어 채택하지 않는다.

### 5.3 호출 패턴 — PayLead 검증 기준 운영 hardening

`schemathesis.toml`:

```toml
# read-only operation 만 (idempotent 보장)
[[operations]]
exclude-method = "POST"
exclude-method = "PUT"
exclude-method = "PATCH"
exclude-method = "DELETE"

# prod 부담 throttling — bconnect.to 1 인스턴스 가정 (PayLead 검증 기준)
rate-limit = "30/m"
request-timeout = 10.0
request-retries = 0
max-redirects = 3

# fuzz 비활성화 — 각 endpoint 1 회 호출
hypothesis-max-examples = 1

# prod log 식별 — fine-pine 이 trace 가능
[headers]
User-Agent = "Morton-Schemathesis-CI/1.0 (github.com/mortonCareer/bconnect)"
```

User-Agent 명시는 prod BE log 에서 CI traffic 을 식별/차단/rate-limit 분리 가능하게 하는 운영 hygiene. **fine-pine 사전 합의** 필요 — prod log 의문의 fuzz traffic 으로 알람 안 나도록.

### 5.4 known-issues escape hatch

false positive (도구 자체 결함) 와 알려진 미정렬 (#326 같은) 등록:

`packages/api-client/schemathesis-known-issues.yaml`:

```yaml
- operation: 'GET /api/v1/credentials/types'
  check: status_code_conformance
  reason: 'BE SecurityFilterChain 미정렬 (#326)'
  expires: '2026-06-01'
  registered_by: '@manamana32321'
```

`expires` 필드가 **자동 만료** — 만료 일자 지나면 ignore 무효, CI 가 다시 fail. 잊혀진 ignore 누적 방지. expires 갱신은 명시적 commit 으로만.

---

## 6. 결과 표시 + 실패 처리

### 6.1 PR sticky comment

`marocchino/sticky-pull-request-comment@v2` 사용. 헤더 `contract-test`, `spec-diff` 별도로 매 commit 마다 update — 댓글 누적 0. 한글, 합쇼체 (외부 노출 톤). 통과/실패 endpoint 별로 collapsible 섹션 분리.

### 6.2 실패 정책 — warn-only

- contract-test job 의 Schemathesis 실행 step 에 `continue-on-error: true`
- spec-diff job 의 oasdiff step 에도 `continue-on-error: true` (Phase 1 은 warn-only)
- step 실패 시 GitHub Actions UI 에서 ❌ 표시 (가시성 유지)
- job conclusion 은 success → branch protection 영향 없음
- **branch protection 의 required check 에 contract-test / spec-diff 등록하지 않음** — release PR mergeable 에 영향 없음을 보장

---

## 7. 테스트 / 회귀 / 운영 모니터링

### 7.1 도입 PR 자체의 검증

- 로컬 dry-run: dev 워크트리에서 schemathesis 직접 실행 → 11 endpoint 결과 확인 (현재 기준선: 10 통과 / 1 실패 with #326 — known-issues 등록 후 0 실패)
- PR 트리거 확인: contract-test job 정상 실행 + sticky comment 작동
- 실패 격리 검증: contract-test job 실패가 PR mergeable 에 영향 없음
- oasdiff 검증: 의도적으로 spec 에 breaking change 추가 후 PR 코멘트 출력 확인

### 7.2 회귀 발견 시나리오

- BE drift: 응답 필드 추가/제거 → schema 위반 → 자동 노출
- spec drift: BE 가 따라오지 않은 spec 변경 → status 또는 schema 위반 → 자동 노출
- envelope 변경: 미래의 [#266](https://github.com/mortonCareer/bconnect/pull/266) 같은 overhaul → 모든 endpoint schema 위반 → 통합 시점 즉시 노출
- spec breaking change: PR 시점에 oasdiff 가 자동 감지 → 사람 의식 의존 X

### 7.3 prod BE 부담

11 endpoint × 1 회 × PR 평균 5-10/일 = 일 55-110 호출. PayLead 기준 rate-limit 30/m. Read-only GET, 무시 가능 수준.

### 7.4 회고

Phase 1 도입 후 **2 주 또는 3 release cycle** 시점 (둘 중 빠른 쪽) 에 회고. 측정 지표:

- 발견 미정렬 건수
- fix 까지 걸린 시간
- false positive 비율
- known-issues YAML 의 expires 위반 건수 (잊혀진 ignore 검출)

회고 결과 → strict 전환 / Phase 2 확장 / 폐기 결정. 회고 트리거는 별도 follow-up issue 로 등록.

---

## 8. 진화 경로

| Phase        | 범위                                                 | enforcement                | 추가 작업                                      |
| ------------ | ---------------------------------------------------- | -------------------------- | ---------------------------------------------- |
| **1** (현재) | public GET (`security: []`) + spec breaking change   | warn-only                  | 본 design                                      |
| 1.5          | spec 의 모든 auth GET endpoint 에 401 응답 정의 추가 | (spec 작업)                | 별도 spec PR — Phase 2 사전 작업               |
| 2            | + auth GET (test user 토큰)                          | warn-only → 안정화 후 차단 | test user 발급 (CEO 협의), GH Secret 토큰 관리 |
| 3            | + non-mutating POST (`/auth/otp/send` 등)            | 차단                       | rate-limit 더 보수적 (10/m), 별도 PR           |
| 4            | stateful workflow (Schemathesis stateful)            | 차단                       | **dev BE 격리 환경 필요 → ADR-0006 재검토**    |
| 5            | cron workflow (PR 외 BE drift 모니터링)              | 알림 (Slack)               | 별도 workflow + 알림 채널                      |

Phase 4 가 ADR-0006 재검토 트리거다. dev BE 환경 분리는 본 design 의 결정 사항은 아니지만, **장기적으로 누적되는 비용**으로 인지한다.

oasdiff 는 Phase 1 부터 warn-only 로 도입, Phase 2 부터 strict (breaking change = release 차단) 전환 검토.

---

## 9. 산출물

- [`docs/reference/specs/2026-05-10-contract-testing-design.md`](./2026-05-10-contract-testing-design.md) (본 문서)
- [`.github/workflows/ci-integration.yml`](../../../.github/workflows/ci-integration.yml) (contract-test + spec-diff job 추가)
- `scripts/contract-extract-public.mjs` (spec preprocessing — public GET 만 추출)
- `scripts/format-contract-comment.mjs` (Schemathesis 결과 → 한글 마크다운)
- `packages/api-client/schemathesis.toml` (Schemathesis 운영 설정)
- `packages/api-client/schemathesis-known-issues.yaml` (알려진 미정렬 + expires)

---

## 10. Acceptance criteria

- [ ] design doc 머지
- [ ] contract-test job 이 dev → main PR 트리거 시 정상 실행
- [ ] spec-diff (oasdiff) job 이 spec 변경 PR 시 정상 실행
- [ ] PR sticky comment 가 한글로 결과 표시
- [ ] contract-test / spec-diff job 실패가 PR mergeable 에 영향을 주지 않음 (warn-only 검증)
- [ ] [#326](https://github.com/mortonCareer/bconnect/issues/326) 이 검증 결과에 포함되어 즉각 표시됨 (known-issues 등록 시 ignore)
- [ ] schemathesis-known-issues.yaml 의 `expires` 만료 시 CI fail 동작 검증
- [ ] User-Agent `Morton-Schemathesis-CI/1.0` 가 prod BE log 에서 식별 가능
- [ ] 회고 follow-up issue 등록

---

## 11. 외부 검증

본 design 은 [tech-scout](../../../.claude/plans/) 의 ADR-style 분석 결과를 반영한 v2 이다. 핵심 검증 포인트:

- **Schemathesis 채택은 산업 표준 패턴**: PyPI 3.4M/월, MIT, 활발 유지보수, 학술 1.4-4.5x defect detection
- **PayLead 도입 사례**가 우리 디자인과 거의 동일: GitLab CI nightly + rate-limit + custom hooks
- **대안 verdict**: Dredd dead, Pact paradigm mismatch, Microcks over-engineered, Specmatic/swagger-request-validator BE 영역 강제 (도입 불가)
- **layered defense 필요성**: Schemathesis 만으론 spec PR 자체의 breaking change 못 잡음 → oasdiff 추가
- **false positive 회피**: known-issues YAML + expires 자동 만료 패턴은 PayLead 의 custom hooks 패턴 차용

장기적 보완재로 fine-pine 영역의 [Atlassian swagger-request-validator](https://bitbucket.org/atlassian/swagger-request-validator) (BE unit test 통합) 과 dev BE 환경 분리 검토는 별도 논의 보류.
