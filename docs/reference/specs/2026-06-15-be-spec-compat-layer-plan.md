# BE-spec Compat Layer (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 손-작성 OpenAPI spec 폐기 마이그레이션의 **FE 전용·무-BE-의존 1단계** — BE springdoc spec을 orval이 소비하는 compat 레이어(PoC 검증 완료)를 프로덕션 품질로 굳히고, BE↔FE drift를 **비차단 CI 체크**로 상시 가시화한다. 플립(손-spec 삭제)은 하지 않는다.

**Architecture:** becompat transformer(네이밍 규칙 + envelope unwrap + auth 보충 병합 + title override)는 PoC에서 작동 검증됨. 본 플랜은 (1) transformer 입력을 CI-커밋 BE spec(`src/openapi.yaml`)으로 고정, (2) 생성 결과를 검증하는 harness 스크립트 작성(canonical 심볼 존재 + 네이밍-회귀 가드), (3) 비차단 CI 잡으로 연결. 신규 테스트 프레임워크 없이 기존 도구(orval + tsc + node)로 검증.

**Tech Stack:** orval 8 (codegen), openapi3-ts (transformer 타입), Node 24 (`node` 스크립트, 신규 의존성 0), 기존 `tsc --noEmit` (career/plan typecheck), GitHub Actions.

**Scope note:** 이 플랜은 [설계 문서](./2026-06-15-be-spec-ssot-migration-design.md)의 **롤아웃 1단계만** 다룬다. 2~6단계(BE nullability·환상엔드포인트 / FE C-정합 / CI 차단게이트 / 플립 / ADR)는 BE 협업·합의에 게이트되어 별도 플랜으로 분리한다 (본 문서 말미 "Follow-up plans").

---

## File Structure

| 파일                                                   | 책임                                                 | 상태                                               |
| ------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------- |
| `packages/api-client/orval.transformer.becompat.ts`    | spec 변환 (네이밍·envelope·보충병합·title·prune)     | 존재 (PoC) — 입력고정 위해 무변경, 회귀가드가 보호 |
| `packages/api-client/auth-supplement.ts`               | 필터 엔드포인트(verify/refresh) path+schema          | 존재 (PoC)                                         |
| `packages/api-client/orval.config.becompat.ts`         | becompat 입력=`src/openapi.yaml`                     | 수정 (target 전환)                                 |
| `packages/api-client/scripts/check-be-spec-compat.mjs` | 검증 harness (심볼존재 + 네이밍회귀 가드 + 갭리포트) | 신규                                               |
| `packages/api-client/package.json`                     | `compat:check` 스크립트                              | 수정                                               |
| `.github/workflows/ci.yml`                             | 비차단 compat 잡                                     | 수정                                               |

---

## Task 1: src/openapi.yaml 신선도 보장 (입력 고정은 완료)

becompat config 입력은 이미 `packages/api-client/src/openapi.yaml`(`ci-api-spec` 잡이 `apps/api/**` 변경 시 재생성·커밋하는 BE springdoc 산출)로 설정됨 (커밋 `b2223791`). 이 Task는 그 입력이 **현재 BE와 정합**한지 보장한다 — drift 체크 정확도의 전제.

**Files:**

- (검증용, 수정 없음) `packages/api-client/orval.config.becompat.ts` (target=`./src/openapi.yaml`)

- [ ] **Step 1: 입력이 src/openapi.yaml 인지 확인**

Run: `grep "target:" packages/api-client/orval.config.becompat.ts`
Expected: `target: './src/openapi.yaml',`

- [ ] **Step 2: src/openapi.yaml 신선도 확인 (현재 BE와 일치)**

Run:

```bash
cd apps/api && ./gradlew generateOpenApiDocs && cd ../..
diff <(python3 -c "import yaml; print(sorted(yaml.safe_load(open('apps/api/build/openapi.yaml')).get('paths',{})))") \
     <(python3 -c "import yaml; print(sorted(yaml.safe_load(open('packages/api-client/src/openapi.yaml')).get('paths',{})))")
```

Expected: diff 없음 (커밋 spec = 현재 BE). diff 있으면 → `cp apps/api/build/openapi.yaml packages/api-client/src/openapi.yaml` 후 커밋.

- [ ] **Step 3: becompat 생성 확인**

Run: `pnpm --filter @bconnect/api-client exec orval --config orval.config.becompat.ts`
Expected: `🎉 morton - Your OpenAPI spec has been converted` (에러 없음)

---

## Task 2: 검증 harness — canonical 심볼 존재 단언

compat 생성 결과에 FE가 import하는 핵심 심볼이 실제로 존재하는지 단언한다. 누락 시 비-0 종료(실패).

**Files:**

- Create: `packages/api-client/scripts/check-be-spec-compat.mjs`

- [ ] **Step 1: harness 작성 (심볼 존재 단언)**

```js
// packages/api-client/scripts/check-be-spec-compat.mjs
// BE-spec compat 검증: becompat 생성 → 생성물에 canonical 심볼 존재 단언.
// 신규 테스트 프레임워크 없이 생성 파일 텍스트를 검사.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const GENERATED = 'src/generated/api.ts'

// FE 가 import 하는, 배선이 보장해야 할 canonical 심볼 (네이밍 규칙 + enum + auth 보충 산물)
const REQUIRED = [
  'useGetFeeds',
  'getGetFeedsQueryKey',
  'useGetMyMember',
  'useGetProfile',
  'useGetCoworkers',
  'useGetCredentials',
  'getSentRecommendations',
  'useVerifyOtp',
  'getVerifyOtpMockHandler',
  'getRefreshTokenMockHandler',
  'getBconnectAPIMock',
]

console.log('▶ becompat 생성...')
execSync('pnpm exec orval --config orval.config.becompat.ts', { stdio: 'inherit' })

const src = readFileSync(GENERATED, 'utf8')
const missing = REQUIRED.filter(
  (n) => !new RegExp(`export (const|function|type|interface) ${n}\\b`).test(src)
)

if (missing.length) {
  console.error('✖ 누락 canonical 심볼 (배선 회귀):', missing.join(', '))
  process.exit(1)
}
console.log(`✓ canonical 심볼 ${REQUIRED.length}개 전부 생성됨`)
```

- [ ] **Step 2: 실행하여 통과 확인**

Run: `cd packages/api-client && node scripts/check-be-spec-compat.mjs`
Expected: `✓ canonical 심볼 11개 전부 생성됨` (exit 0)

- [ ] **Step 3: Commit**

```bash
git add packages/api-client/scripts/check-be-spec-compat.mjs
git commit -m "test(api-client): becompat canonical 심볼 존재 검증 harness"
```

---

## Task 3: harness — 네이밍-회귀 가드 (typecheck 분류)

career/plan typecheck의 "no exported member" 누락을 **알려진 BE-트랙 allowlist**와 대조한다. allowlist 밖 누락 = 네이밍 규칙 회귀 → 실패. allowlist(환상엔드포인트·shape)는 BE/협업 게이트라 비차단 정보로만.

**Files:**

- Modify: `packages/api-client/scripts/check-be-spec-compat.mjs`

- [ ] **Step 1: 회귀 가드 추가**

`check-be-spec-compat.mjs` 끝에 추가:

```js
// 알려진 BE-트랙 갭 (환상 엔드포인트 B / 엔티티 shape C) — 네이밍 회귀 아님.
// 설계문서 §6 참조. 이 목록 밖의 누락 export = 네이밍/배선 회귀 → 실패.
const KNOWN_BE_GAPS = new Set([
  'useGetMyProfile',
  'getGetMyProfileQueryKey',
  'getGetMyProfileResponseMock',
  'getGetMyProfileMockHandler',
  'useGetChat',
  'getGetChatMockHandler',
  'useCreateDirectChat',
  'getRegisterDeviceMockHandler',
  'DevicePlatform',
  'ProfileAndMember',
  'MaskedMember',
])

console.log('▶ career/plan typecheck 분류...')
const missingExports = new Set()
for (const app of ['morton-career', 'morton-plan']) {
  let out = ''
  try {
    execSync(`pnpm --filter ${app} typecheck`, { cwd: '../..', encoding: 'utf8' })
  } catch (e) {
    out = (e.stdout ?? '') + (e.stderr ?? '')
  }
  for (const m of out.matchAll(/no exported member (?:named )?'?([A-Za-z]+)'?/g)) {
    missingExports.add(m[1])
  }
}

const regressions = [...missingExports].filter((n) => !KNOWN_BE_GAPS.has(n))
const beGaps = [...missingExports].filter((n) => KNOWN_BE_GAPS.has(n))

console.log(`ℹ BE-트랙 갭 (비차단, BE/협업 대기): ${beGaps.join(', ') || '없음'}`)
if (regressions.length) {
  console.error('✖ 네이밍/배선 회귀 (allowlist 밖 누락):', regressions.join(', '))
  process.exit(1)
}
console.log('✓ 네이밍 회귀 없음 — 잔여는 전부 알려진 BE-트랙 갭')
```

- [ ] **Step 2: 실행하여 통과 확인**

Run: `cd packages/api-client && node scripts/check-be-spec-compat.mjs`
Expected: `ℹ BE-트랙 갭 ...` 출력 후 `✓ 네이밍 회귀 없음` (exit 0). 회귀 도입 시(예: 예외맵 항목 삭제) exit 1.

- [ ] **Step 3: 복원 (harness가 src/generated를 becompat로 덮어씀)**

Run: `pnpm api:generate` (워크트리의 src/generated를 손-spec 기준으로 복원 — 프로덕션 무오염 유지)
Expected: 생성 완료

- [ ] **Step 4: package.json 스크립트 + Commit**

`packages/api-client/package.json` scripts에 추가:

```json
    "compat:check": "node scripts/check-be-spec-compat.mjs"
```

```bash
git add packages/api-client/scripts/check-be-spec-compat.mjs packages/api-client/package.json
git commit -m "test(api-client): becompat 네이밍-회귀 가드 + compat:check 스크립트"
```

---

## Task 4: 비차단 CI compat 잡

`apps/api/**` 또는 `packages/api-client/**` 변경 시 compat:check 실행. **비차단**(`continue-on-error: true`) — 정보용 drift 가시화. 네이밍 회귀만 빨강(잡 실패 표시), BE-트랙 갭은 로그.

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: ci-be-spec-compat 잡 추가**

`.github/workflows/ci.yml`의 jobs에 추가 (`ci-api-spec` 잡 뒤):

```yaml
ci-be-spec-compat:
  needs: [changes, ci-api-spec]
  if: ${{ always() && (needs.changes.outputs.api-spec == 'true' || needs.changes.outputs.packages == 'true') }}
  runs-on: ubuntu-latest
  continue-on-error: true # 비차단 — BE↔FE drift 정보용
  steps:
    - uses: actions/checkout@v6
      with:
        ref: ${{ github.head_ref }}
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v6
      with:
        node-version: 24
        cache: 'pnpm'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: BE-spec compat check
      run: pnpm --filter @bconnect/api-client compat:check
```

- [ ] **Step 2: 워크플로 YAML 유효성 확인**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML OK')"`
Expected: `YAML OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: 비차단 be-spec compat drift 체크 잡 추가"
```

---

## Self-Review (작성자 체크)

- **Spec coverage:** 설계문서 1단계(compat 레이어 굳히기 + drift 가시화) = Task 1~4 커버. 2~6단계는 Follow-up으로 명시 분리(BE 게이트). ✓
- **Placeholder scan:** 모든 step에 실제 코드/명령 포함. TBD/TODO 없음. ✓
- **Type consistency:** harness가 참조하는 심볼(useGetFeeds 등)은 PoC 생성물에서 확인된 실명. `compat:check` 스크립트명 Task3·4 일치. ✓
- **회귀가드 견고성:** allowlist(KNOWN_BE_GAPS)는 설계문서 §6 B/C 항목과 정합. BE가 환상엔드포인트 구현하면 그 항목이 생성되어 allowlist에서 자연 제거(누락 아님) → 가드 영향 없음. ✓

---

## Follow-up plans (별도, BE 협업/합의 게이트)

본 플랜 완료 후, drift 체크가 초록에 가까워지는 것을 보며 순차 진행:

1. **BE 정확도** (BE/CEO 소유): springdoc `required` emit 설정(nullability) — 최대 단일 레버. + 환상 엔드포인트(B: getMyProfile, devices, getChat, roles, trades, coworkers/tasks) 구현 or 폐기 합의.
2. **FE C-정합** (FE): `createDirectChat`→`createChat`, `MaskedMember`→`MemberSummary` 어댑트, `ProfileAndMember` 소비부 조정.
3. **CI 차단 게이트로 승격**: compat:check가 회귀+잔여 0이 되면 `continue-on-error` 제거.
4. **플립**: `orval.config.ts` 입력→`src/openapi.yaml`, becompat transformer 승격, **손-spec/redocly/bundle/becompat config 삭제**.
5. **ADR**: ADR-0015 보류결정 종결 — "BE springdoc + 최소 수동 보충을 spec 소스로".
