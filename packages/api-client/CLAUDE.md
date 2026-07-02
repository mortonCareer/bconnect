# API Spec 작업 가이드

`@bconnect/api-client` 의 OpenAPI spec 작성 + codegen 가이드. BE 코드가 API 기준(SSOT)이며 ([ADR-0015](../../docs/explanation/adr/0015-be-code-as-api-ssot.md)), 본 문서는 BE 구현 후 스펙을 갱신하는 작성 절차를 다룹니다. spec 변경 시 이 문서 + spec 파일 동시 reference.

## 디렉토리 구조

```text
packages/api-client/
├── .redocly.yaml                            # lint 규칙 + bundle config
├── orval.config.ts                          # codegen 설정 (hook + MSW mock)
└── src/
    ├── spec/                                # 분리된 spec (BE 코드를 따라가는 산출물)
    │   ├── openapi.yaml                     # 진입점: info, tags, paths 매핑, securityScheme ref
    │   ├── _shared.yaml                     # cross-cutting: HTTP envelope/error + cross-domain entity
    │   └── v1/                              # 12 도메인 파일 (self-contained)
    │       ├── auth.yaml                    # paths + securitySchemes + JwtPayload + 도메인 schemas
    │       ├── members.yaml                 # paths + 도메인 schemas
    │       └── ...                          # chats, profiles, credentials, ...
    ├── openapi.bundled.yaml                 # redocly bundle 산출물 (gitignored)
    ├── generated/                           # orval 산출물 (gitignored)
    │   ├── api.ts                           # react-query hook + MSW mock aggregator
    │   └── schemas/                         # 각 schema 의 TS 타입
    └── client.ts                            # customFetch (envelope unwrap + token refresh)
```

## 디렉토리 axis 결정 근거

### `paths/v1/<resource>/...` — 버전 + 리소스 (도메인 packing 시 `v1/<domain>.yaml` 단일 파일)

- 향후 v2 등장 시 `v1/` ↔ `v2/` clean break
- URL 구조 ↔ 디렉토리 1:1 매핑
- 도메인 packing 으로 `paths + components` 한 파일 — 도메인 일관성, navigation 친화

### `_shared.yaml` — protocol-level cross-cutting + cross-domain entity

| schema                         | 이유                                                    |
| ------------------------------ | ------------------------------------------------------- |
| `ApiSuccessResponseBase`       | 모든 200 응답 envelope (HTTP protocol level)            |
| `ApiError`, `ApiErrorResponse` | 모든 4xx/5xx 응답 형식                                  |
| `Address`                      | 여러 도메인이 ref (Profile, Task) — cross-domain entity |

→ "어느 도메인이 발급/소유" 의 ownership 명확하지 않은 schema 만.

### `v1/<domain>.yaml` 안 — 도메인 specific

| schema                                    | 위치 결정 근거               |
| ----------------------------------------- | ---------------------------- |
| `Member`, `Chat`, `Profile` 등 entity     | 해당 도메인이 발급/소유      |
| `JwtPayload`                              | auth 가 token 발급 책임      |
| `bearerAuth`, `cookieAuth` securityScheme | auth 가 token 발급/갱신 책임 |
| `*Request`, `*Response` DTO               | 1회용 → 발급 도메인          |

cross-domain ref 가 발생하면 `'../v1/<other>.yaml#/components/schemas/X'` 외부 ref — 도메인 의존 그래프 명시화.

## Ref 패턴

| 위치               | ref 형태                                           | 예시                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| 도메인 내부        | internal `#/components/schemas/X`                  | `'#/components/schemas/SendCodeRequest'` (auth.yaml 안에서) |
| 다른 도메인        | external `'../v1/<other>.yaml#/...'`               | `'../v1/members.yaml#/components/schemas/Role'`             |
| `_shared`          | external `'../_shared.yaml#/components/schemas/X'` | `'../_shared.yaml#/components/schemas/ApiErrorResponse'`    |
| root → 도메인 path | JSON Pointer escape                                | `'v1/auth.yaml#/paths/~1api~1v1~1auth~1otp~1send'`          |

## 새 endpoint 추가 절차

BE 구현이 마무리된 후 스펙을 갱신하는 절차입니다.

### 1. Schema 위치 결정

```text
새 schema 가 필요한가?
├─ 단순 1회용 DTO (Request/Response) ─→ 해당 도메인 파일 안의 components.schemas
├─ 도메인 entity (Member, Chat 등)   ─→ 해당 도메인 파일 안
├─ 2+ 도메인이 ref               ─→ 첫 ref 도메인에 두고 cross-domain ref
└─ Protocol-level cross-cutting   ─→ _shared.yaml
```

### 2. Path 파일 추가

도메인 파일 (`v1/<domain>.yaml`) 의 paths 섹션에 추가:

```yaml
# v1/members.yaml
paths:
  /api/v1/members/me/preferences:
    get:
      operationId: getMyPreferences
      tags: [Members]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: ../_shared.yaml#/components/schemas/ApiSuccessResponseBase
                  - type: object
                    required: [data]
                    properties:
                      data:
                        $ref: '#/components/schemas/MemberPreferences'
        '401':
          description: |
            - `A007` 유효하지 않은 액세스 토큰입니다
          content:
            application/json:
              schema:
                $ref: ../_shared.yaml#/components/schemas/ApiErrorResponse
```

### 3. Root openapi.yaml 등록

`paths` 섹션에 JSON Pointer escape 형태:

```yaml
/api/v1/members/me/preferences:
  $ref: v1/members.yaml#/paths/~1api~1v1~1members~1me~1preferences
```

### 4. 로컬 검증

```bash
pnpm api:lint        # redocly lint
pnpm api:generate    # bundle + orval (TS hook + MSW mock)
pnpm exec tsc --noEmit  # api-client typecheck
```

### 5. PR 생성 + ci-api-spec 통과 확인

## Envelope 패턴

### 성공 응답 (200/201) — `allOf` wrap

```yaml
responses:
  '200':
    content:
      application/json:
        schema:
          allOf:
            - $ref: ../_shared.yaml#/components/schemas/ApiSuccessResponseBase
            - type: object
              required: [data]
              properties:
                data:
                  $ref: '#/components/schemas/<DomainType>'
```

`ApiSuccessResponseBase` 가 `success: const: true` 만 정의. `data` 는 endpoint 별 schema. `customFetch` 가 envelope unwrap → hook 의 `data` 가 inner type.

### Void 응답 (DELETE 등)

```yaml
responses:
  '200':
    description: OK # content/schema 없음 — wrap 안 함
```

`ExtractData<T>` 가 fallback 으로 처리.

### 에러 응답 (4xx/5xx)

```yaml
responses:
  '400':
    description: |
      - `C001` 유효하지 않은 입력값입니다
    content:
      application/json:
        schema:
          $ref: ../_shared.yaml#/components/schemas/ApiErrorResponse
```

description 의 error code list 는 인간용 안내. `ApiErrorResponse` schema 는 `{success: false, error: ApiError, data: null}` 표준 형태.

## RFC 표준 인용 컨벤션

표준 follow 시 inline 주석으로 RFC 링크:

```yaml
bearerAuth:
  type: http
  scheme: bearer # https://datatracker.ietf.org/doc/html/rfc6750#section-6.1.1
  bearerFormat: JWT # https://datatracker.ietf.org/doc/html/rfc7519#section-4.1
```

Schema property 도 동일:

```yaml
JwtPayload:
  properties:
    sub: # https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.2
      type: string
    exp: # https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4
      type: integer
```

## Custom Extensions (`x-` prefix)

OpenAPI §4.9 Specification Extensions — vendor-specific 의미 명시.

```yaml
bearerAuth:
  x-jwt-payload-schema:
    $ref: '#/components/schemas/JwtPayload'
```

표준 도구는 무시하지만 spec 차원 contract 등록. custom plugin 작성 시 활용.

## Codegen 출력

| 파일                       | 내용                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `generated/api.ts`         | react-query hook (use*Query, use*Mutation, use*Suspense) + MSW mock handler (get*MockHandler, getBconnectAPIMock) |
| `generated/schemas/<X>.ts` | 도메인 type interface                                                                                             |

FE 사용 패턴:

```typescript
// Hook 호출 — data 는 envelope unwrap 된 inner type
import { useGetMyMember } from '@bconnect/api-client'
const { data, isLoading } = useGetMyMember()
// data: Member (envelope 사라짐)

// Type import — entity 직접 사용
import type { Member, Profile } from '@bconnect/api-client'

// MSW mock setup (test/dev)
import { setupServer } from 'msw/node'
import { getBconnectAPIMock } from '@bconnect/api-client'
const server = setupServer(...getBconnectAPIMock())
```

## 도구 체인

| 명령어              | 동작                                                     |
| ------------------- | -------------------------------------------------------- |
| `pnpm api:lint`     | `redocly lint` — spec 검증 (CI 의 `ci-api-spec` 도 동일) |
| `pnpm api:bundle`   | `redocly bundle` — 14 파일 → `openapi.bundled.yaml`      |
| `pnpm api:generate` | bundle + orval chain (codegen)                           |

`.redocly.yaml` 의 lint 규칙 — 활성화 후보들 TODO 로 등록되어 있음. 점진 enable 권장.

## 자주 하는 실수

### 1. ref 상대경로 계산 오류

`v1/auth.yaml` (`spec/v1/auth.yaml`) 에서 `_shared.yaml` (`spec/_shared.yaml`) 까지:

- ✅ `../_shared.yaml#/components/schemas/X`
- ❌ `_shared.yaml#/...` (auth.yaml 기준이라 v1/\_shared.yaml 가리킴)

### 2. JSON Pointer escape 누락

root openapi.yaml 의 path ref 는 escape 필수:

- ✅ `v1/auth.yaml#/paths/~1api~1v1~1auth~1otp~1send` (`/` → `~1`)
- ❌ `v1/auth.yaml#/paths//api/v1/auth/otp/send`

### 3. Cross-cutting 으로 잘못 분류

새 schema 추가 시 "어느 도메인이 ownership?" 질문. 1 도메인만 사용하면 그 도메인 안. 2+ 라도 첫 정의 도메인에 두고 cross-ref. **`_shared` 는 protocol level (envelope/error) + 명백한 cross-domain entity (Address) 만**.

### 4. Bundle drop — 어떤 path 도 ref 안 하는 schema

paths 의 ref graph 에 닿지 못하면 redocly bundle 에서 누락. cases:

- 응답 schema 가 inline schema 라 `$ref` 거치지 않음
- securityScheme 의 description 에서 `[X](#/components/schemas/X)` markdown link 만 있음 (실제 ref 아님)

해결: root openapi.yaml 의 `components.schemas` 에 manifest 등록 — `$ref: <where>/<X>` 로 traversal entry.

### 5. void 응답에 envelope 추가

`DELETE` 같은 endpoint 응답에 envelope wrap 추가하면 `ExtractData<T>` fallback 어긋남. void 응답은 `description: OK` 만 두고 content schema 생략.

## 검증 패턴

### Spec 변경 후

```bash
pnpm api:lint && pnpm api:generate && pnpm exec tsc --noEmit
```

### MSW + customFetch 통합 검증 (PoC)

orval mock + customFetch 가 envelope unwrap 정상 작동하는지 — node 환경에서:

```typescript
import { setupServer } from 'msw/node'
import { getBconnectAPIMock, sendOtp } from '@bconnect/api-client'
const server = setupServer(...getBconnectAPIMock())
server.listen()
const result = await sendOtp({ phone: '01012345678' })
// envelope 사라지고 inner data: { expiresAt: '...' }
```

### 의미 동등 검증 (refactoring 후)

이전 spec 과 의미 동등한지 — paths/operationId/domain schemas 비교:

```python
# baseline 의 monolithic openapi.yaml + 현재 bundled.yaml 비교
# paths URL set, operationId set, domain schema properties 동등 검증
```

## 관련 문서

- [docs/how-to/development-workflow.md](../../docs/how-to/development-workflow.md) — 워크플로 (이슈 → 브랜치 → PR → 머지)
- [PR #266](https://github.com/mortonCareer/bconnect/pull/266) — 본 spec 구조의 도입 PR (envelope wrap, 도메인 packing, 3.1 업그레이드, MSW mock generation)

## 후속 이슈

- [#270](https://github.com/mortonCareer/bconnect/issues/270) — error code 도메인 정의 (`ApiErrorCode` enum + 4xx response 별 가능 code 명시)
