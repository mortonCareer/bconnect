# Contract Testing 도입 설계 (Phase 1)

> **For**: 통합 CI 및 spec ↔ BE 정합성 검증 작업자.
> **You'll be able to**: dev → main 통합 시점에 Schemathesis 로 spec ↔ BE 미정렬을 자동 발견하는 구조와 결정 컨텍스트 이해.

**작성일**: 2026-05-10
**관련 이슈**: [mortonCareer/bconnect#328](https://github.com/mortonCareer/bconnect/issues/328)
**관련 ADR**: [explanation/adr/0003-openapi-3-1-with-domain-split.md](../../explanation/adr/0003-openapi-3-1-with-domain-split.md), [explanation/adr/0004-api-response-envelope.md](../../explanation/adr/0004-api-response-envelope.md), [explanation/adr/0006-dev-as-staging.md](../../explanation/adr/0006-dev-as-staging.md)
**상태**: Draft (review 중)

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

### 명시적 비범위 (Phase 1)

- 인증 endpoint 검증 — Phase 2 로 이연
- BE 응답 fuzz testing — prod 부담, 가치 낮음
- spec 자체의 design quality 검증 — 사람 리뷰 영역
- BE 코드 변경 — `apps/api/` 미관여 정책
- 알려진 미정렬 allowlist 관리 — Phase 1.5+ 도입 검토

---

## 3. 핵심 설계 결정 요약

| 영역          | 결정                             | 대안                  | 이유                                              |
| ------------- | -------------------------------- | --------------------- | ------------------------------------------------- |
| 도구          | Schemathesis                     | Pact, Dredd, custom   | OpenAPI 3.x 네이티브, 표준, GH Action 공식        |
| 검증 범위     | public GET only (11)             | 인증 포함, write 포함 | Phase 1 최소 진입, prod 부담 최소                 |
| 트리거        | `ci-integration.yml` 별도 job    | 별도 workflow + cron  | Phase 1 단순화, cron 은 Phase 3                   |
| 실패 정책     | warn-only (`continue-on-error`)  | strict block          | 도입 ROI 검증 후 strict 전환 결정                 |
| public 필터링 | preprocessing 스크립트           | 401 응답 정의 활용    | spec 의 401 정의 0/13 이라 활용 불가              |
| 결과 표시     | PR sticky comment (한글, 합쇼체) | job summary, Slack    | 외부 노출 톤 일관성, 매 commit 마다 자동 갱신     |
| 미정렬 처리   | allowlist 없음                   | YAML allowlist        | Phase 1 자연 압박, allowlist 는 도입 가치 검증 후 |

---

## 4. 시스템 구성

```
[ci-integration.yml]
    │
    ├─ integration job (기존, FE 통합 검증)
    │   ├─ install + api:generate + typecheck + build
    │   └─ release blocker
    │
    └─ contract-test job (신규, 병렬, warn-only)
        ├─ install (postinstall 로 spec bundle 자동 생성)
        ├─ scripts/contract-extract-public.mjs
        │   └─ openapi.bundled.yaml → openapi.public.yaml
        ├─ Schemathesis run @ https://api.bconnect.to
        │   └─ checks: status_code, content_type, response_schema
        └─ scripts/format-contract-comment.mjs
            └─ Schemathesis 결과 → 한글 sticky comment
```

### 4.1 구성 요소 (단위 분리)

| 단위                                  | 책임                                            | 의존                               |
| ------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| `ci-integration.yml`                  | 두 job orchestration, 권한 분리                 | GitHub Actions                     |
| `scripts/contract-extract-public.mjs` | spec preprocessing — `security: []` GET 만 추출 | `js-yaml`, `openapi.bundled.yaml`  |
| Schemathesis CLI                      | spec ↔ live BE 검증                             | Python 환경, `openapi.public.yaml` |
| `scripts/format-contract-comment.mjs` | Schemathesis JSON → 한글 마크다운 포맷          | Schemathesis report 출력           |

각 단위는 단일 책임을 가지며 파일 입출력으로 통신한다. Schemathesis 자체 로직은 변경 대상 외(외부 도구).

### 4.2 권한

`contract-test` job 은 PR sticky comment 생성을 위해 `permissions.pull-requests: write` 필요. `integration` job 은 변경 없음. 권한 최소화 원칙상 job 분리가 자연스럽다.

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

### 5.3 호출 패턴

- 각 endpoint 당 1 회 호출 (`--hypothesis-max-examples=1`)
- fuzz 비활성화
- rate limit 10/s

---

## 6. 결과 표시 + 실패 처리

### 6.1 PR sticky comment

`marocchino/sticky-pull-request-comment@v2` 사용. 헤더 `contract-test` 로 매 commit 마다 update — 댓글 누적 0. 한글, 합쇼체 (외부 노출 톤). 통과/실패 endpoint 별로 collapsible 섹션 분리.

### 6.2 실패 정책 — warn-only

- contract-test job 의 Schemathesis 실행 step 에 `continue-on-error: true`
- step 실패 시 GitHub Actions UI 에서 ❌ 표시 (가시성 유지)
- job conclusion 은 success → branch protection 영향 없음
- **branch protection 의 required check 에 contract-test 등록하지 않음** — release PR mergeable 에 영향 없음을 보장

---

## 7. 테스트 / 회귀 / 운영 모니터링

### 7.1 도입 PR 자체의 검증

- 로컬 dry-run: dev 워크트리에서 schemathesis 직접 실행 → 11 endpoint 결과 확인 (현재 기준선: 10 통과 / 1 실패 with #326)
- PR 트리거 확인: contract-test job 정상 실행 + sticky comment 작동
- 실패 격리 검증: contract-test job 실패가 PR mergeable 에 영향 없음

### 7.2 회귀 발견 시나리오

- BE drift: 응답 필드 추가/제거 → schema 위반 → 자동 노출
- spec drift: BE 가 따라오지 않은 spec 변경 → status 또는 schema 위반 → 자동 노출
- envelope 변경: 미래의 [#266](https://github.com/mortonCareer/bconnect/pull/266) 같은 overhaul → 모든 endpoint schema 위반 → 통합 시점 즉시 노출

### 7.3 prod BE 부담

11 endpoint × 1 회 × PR 평균 5-10/일 = 일 55-110 호출. Read-only GET, rate limit 10/s, 무시 가능 수준.

### 7.4 회고

Phase 1 도입 후 **2 주 또는 3 release cycle** 시점 (둘 중 빠른 쪽) 에 회고. 측정 지표:

- 발견 미정렬 건수
- fix 까지 걸린 시간
- false positive 비율

회고 결과 → strict 전환 / Phase 2 확장 / 폐기 결정. 회고 트리거는 별도 follow-up issue 로 등록.

---

## 8. 진화 경로

### Phase 1.5 — 별도 작업

spec 의 모든 auth GET endpoint 에 401 응답 정의 추가 (현재 0/13 → 13/13). Phase 2 의 사전 작업으로 별도 spec PR.

### Phase 2 — 인증 read 확장

GitHub Secret 에 service account 토큰 + Schemathesis Authorization 헤더 → 인증 endpoint read-only 검증 확장. 토큰 회전/관리 정책 별도 정의 필요.

### Strict 전환

회고 결과 false positive 적고 발견 가치 입증되면 strict block 으로 전환. 이때 known-violations allowlist YAML 도입 — 알려진 미정렬은 명시적 등록(이슈 번호 + 등록일 + 등록자), 새 미정렬만 block.

### Phase 3 — 장기

- cron workflow 로 PR 외 BE drift 모니터링
- write endpoint 검증 — staging BE 환경 도입 후 ([explanation/adr/0006-dev-as-staging.md](../../explanation/adr/0006-dev-as-staging.md) 후속 ADR 필요)

---

## 9. 산출물

- [`docs/reference/specs/2026-05-10-contract-testing-design.md`](./2026-05-10-contract-testing-design.md) (본 문서)
- [`.github/workflows/ci-integration.yml`](../../../.github/workflows/ci-integration.yml) (contract-test job 추가)
- `scripts/contract-extract-public.mjs` (spec preprocessing — public GET 만 추출)
- `scripts/format-contract-comment.mjs` (Schemathesis 결과 → 한글 마크다운)

---

## 10. Acceptance criteria

- [ ] design doc 머지
- [ ] contract-test job 이 dev → main PR 트리거 시 정상 실행
- [ ] PR sticky comment 가 한글로 결과 표시
- [ ] contract-test job 실패가 PR mergeable 에 영향을 주지 않음 (warn-only 검증)
- [ ] [#326](https://github.com/mortonCareer/bconnect/issues/326) 이 검증 결과에 포함되어 즉각 표시됨
- [ ] 회고 follow-up issue 등록
