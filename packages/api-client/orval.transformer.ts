import type {
  OpenAPIObject,
  OperationObject,
  ReferenceObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from 'openapi3-ts/oas31'
import { defineTransformer } from 'orval'
import { authSupplementPaths, authSupplementSchemas } from './auth-supplement'

/**
 * BE-springdoc → FE-canonical 호환 transformer (배선 PoC).
 *
 * 손-spec 폐기 후 orval 이 BE springdoc 산출 spec 을 직접 먹게 하기 위한 compat
 * 레이어. springdoc 의 Java 파생 모양을 FE 가 기대하는 캐논 모양으로 정렬:
 *   - schema rename — 엔티티 `*Response` strip. op-response DTO 만 keep-list 로 유지.
 *   - operationId rewrite — springdoc 쓰레기 opId 무시, (method+path) 규칙. /auth 는 분기
 *     (springdoc/보충 opId 유지), 소수 GET 라우트만 OPID_SPECIAL.
 *   - envelope unwrap — flat `{success,error,data}` 에서 data 만. 그 후 orphan 컴포넌트 prune.
 *   - auth 보충 병합 + info.title override.
 *
 * 규칙 기반 — 새 CRUD 엔드포인트 자동 커버. force-match 예외맵 없음: 규칙 출력과 다른
 * FE 호출부(도메인 동사 등)는 플립 시 FE 가 규칙 출력에 맞춘다(억지 예외 대신).
 * enum 은 BE 가 `ModelResolver.enumsAsRef=true` 로 named $ref 로 emit → FE 처리 불필요.
 */

// Response 를 strip 하지 않고 그대로 둘 op-response DTO (엔티티 아님 — strip 시 CheckUsername
// 등 어색한 타입명). 엔티티 vs op-DTO 구분은 규칙화 어려워 명시 목록 유지.
const SCHEMA_KEEP_RESPONSE = new Set([
  'CheckUsernameResponse',
  'SendOtpResponse',
  'RefreshTokenResponse',
  'RegisterMemberResponse',
  'RegisterDeviceResponse',
  'VerifyOtpLoginResponse',
  'VerifyOtpSignupResponse',
])

// operationId 규칙으로 깔끔히 안 나오는 소수 라우트만 명시 (전 엔드포인트 하드코딩 X).
// 도메인 동사(withdraw/register...)는 예외로 강제하지 않고 규칙의 CRUD 출력
// (deleteMyMember/createMember/...)을 따르며 FE 가 플립 시 호출부를 맞춘다.
const OPID_SPECIAL: Record<string, string> = {
  'GET /api/v1/members/check-username': 'checkUsername',
  'GET /api/v1/credentials/types': 'getCredentialTypes',
  // /auth verb-path — springdoc opId 가 'send'(컨트롤러 메서드명) 등 불안정. 명시.
  // verify/refresh 는 auth-supplement 가 operationId 지정 → /auth 분기가 유지.
  'POST /api/v1/auth/otp/send': 'sendOtp',
  'POST /api/v1/auth/logout': 'logout',
  // 규칙이 구조상 못 잡는 이름 — /me 는 단수 규칙이나 응답이 목록(복수)이거나,
  // verb-path 가 명사-접미(updateOfferReorder)로 어색한 경우.
  'GET /api/v1/credentials/me': 'getMyCredentials',
  'PUT /api/v1/offers/reorder': 'reorderOffers',
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'] as const

export default defineTransformer((spec) => {
  const api = spec as OpenAPIObject
  const schemas = (api.components?.schemas ?? {}) as Record<string, SchemaObject>

  // mock 집계자(getBconnectAPIMock) 이름은 info.title 에서 파생 — BE springdoc 의
  // 'OpenAPI definition' 을 FE 캐논 title 로 고정.
  if (api.info) api.info.title = 'Bconnect API'

  // 필터 기반 인증 엔드포인트(verify/refresh) 보충 — springdoc 불가시 영역만.
  // 없는 path/schema 만 추가 (BE 가 향후 컨트롤러화하면 자동으로 우선).
  api.paths = api.paths ?? {}
  for (const [p, item] of Object.entries(authSupplementPaths)) {
    if (!api.paths[p]) api.paths[p] = item
  }
  for (const [name, s] of Object.entries(authSupplementSchemas)) {
    if (!schemas[name]) schemas[name] = s
  }

  const renameMap = buildRenameMap(schemas)
  applyRename(api, schemas, renameMap)
  rewriteOperationIds(api)
  unwrapEnvelopes(api, schemas)
  pruneOrphans(api, schemas)

  return api
})

// ── schema rename ────────────────────────────────────────────────────────────
function buildRenameMap(schemas: Record<string, SchemaObject>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const name of Object.keys(schemas)) {
    if (name.startsWith('ApiResponse')) continue // envelope wrapper — unwrap 이 제거
    if (name.endsWith('Response') && !SCHEMA_KEEP_RESPONSE.has(name)) {
      map[name] = name.slice(0, -'Response'.length)
    }
  }
  return map
}

function applyRename(
  api: OpenAPIObject,
  schemas: Record<string, SchemaObject>,
  renameMap: Record<string, string>
): void {
  // 컴포넌트 키 교체
  for (const [from, to] of Object.entries(renameMap)) {
    if (from === to || !schemas[from]) continue
    schemas[to] = schemas[from]
    delete schemas[from]
  }
  // 모든 $ref 재작성
  const rewriteRefs = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(rewriteRefs)
      return
    }
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (typeof obj.$ref === 'string') {
      const m = obj.$ref.match(/^#\/components\/schemas\/(.+)$/)
      if (m && renameMap[m[1]]) obj.$ref = `#/components/schemas/${renameMap[m[1]]}`
    }
    for (const v of Object.values(obj)) rewriteRefs(v)
  }
  rewriteRefs(api.paths)
  rewriteRefs(schemas)
}

// ── 3. operationId rewrite (rule + exceptions) ──────────────────────────────

// 리소스 세그먼트 단복수. 규칙적 복수(feeds, coworker-requests …)는 naive `-s`/`+s`.
// naive 로 안 되는 리소스(-ies 등)만 IRREGULAR 에 등재.
const IRREGULAR_SINGULAR: Record<string, string> = { companies: 'company' }
const singularize = (r: string): string =>
  pascal(IRREGULAR_SINGULAR[r] ?? (r.endsWith('s') ? r.slice(0, -1) : r))
const pluralize = (r: string): string => pascal(r.endsWith('s') ? r : `${r}s`)

function pascal(seg: string): string {
  return seg
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

function deriveOperationId(
  method: string,
  path: string,
  springdocOpId: string | undefined
): string {
  const key = `${method.toUpperCase()} ${path}`
  if (OPID_SPECIAL[key]) return OPID_SPECIAL[key]

  const segs = path.replace(/^\/api\/v1\//, '').split('/')
  const resource = segs[0]

  // /auth/* : 컨트롤러 메서드명이 의미적(sendOtp/logout) + verify/refresh 는 보충물이
  // operationId 지정 → springdoc/보충 opId 유지. verb-path 라 일반 규칙 부적합.
  if (resource === 'auth') return springdocOpId ?? key

  const rest = segs.slice(1)
  const isParam = (s: string) => s.startsWith('{')
  const last = rest[rest.length - 1]
  const singular = singularize(resource)

  const verb =
    method === 'get'
      ? 'get'
      : method === 'post'
        ? 'create'
        : method === 'put' || method === 'patch'
          ? 'update'
          : 'delete'

  // 말단 액션 세그먼트 (accept/deny/show/hide/cancel) → 액션 + 단수 (acceptCredential/cancelOffer)
  const ACTIONS = ['accept', 'deny', 'show', 'hide', 'cancel']
  if (last && ACTIONS.includes(last)) return `${last}${singular}`

  // 중첩 서브컬렉션 /{res}/{id}/{sub} → verb + 단수(부모) + Pascal(sub) (getChatMessages)
  if (rest.length >= 2 && isParam(rest[rest.length - 2]) && !isParam(last)) {
    return `${verb}${singular}${pascal(last)}`
  }

  const quals = rest.filter((s) => !isParam(s))
  const hasMe = quals.includes('me')
  const otherQuals = quals.filter((q) => q !== 'me')
  const hasItemParam = rest.some(isParam)

  // 한정자 위치: 목록 한정자(sent/received)는 명사 앞(getMySentRecommendations),
  // 서브필드 한정자(about 등)는 명사 뒤(updateMyProfileAbout).
  const LIST_QUALS = ['sent', 'received']
  const listPrefix = otherQuals
    .filter((q) => LIST_QUALS.includes(q))
    .map(pascal)
    .join('')
  const subSuffix = otherQuals
    .filter((q) => !LIST_QUALS.includes(q))
    .map(pascal)
    .join('')

  // 복수/단수: item 있음 → 단수, me 단독(목록한정자 없음) → 단수, 그 외 GET → 복수
  const plural = method === 'get' && !hasItemParam && !(hasMe && listPrefix === '')
  const noun = plural ? pluralize(resource) : singular

  const myPart = hasMe ? 'My' : ''
  return `${verb}${myPart}${listPrefix}${noun}${subSuffix}`
}

function rewriteOperationIds(api: OpenAPIObject): void {
  for (const [path, item] of Object.entries(api.paths ?? {})) {
    if (!item || typeof item !== 'object') continue
    for (const method of HTTP_METHODS) {
      const op = (item as Record<string, unknown>)[method] as OperationObject | undefined
      if (!op || typeof op !== 'object') continue
      op.operationId = deriveOperationId(method, path, op.operationId)
    }
  }
}

// ── 4. envelope unwrap (flat 인코딩) ─────────────────────────────────────────
function resolveSchema(
  schema: SchemaObject | ReferenceObject,
  schemas: Record<string, SchemaObject>
): SchemaObject {
  if (schema && typeof schema === 'object' && '$ref' in schema && schema.$ref) {
    const name = schema.$ref.replace('#/components/schemas/', '')
    return schemas[name] ?? (schema as unknown as SchemaObject)
  }
  return schema as SchemaObject
}

function extractData(schema: SchemaObject): SchemaObject | ReferenceObject | undefined {
  const props = schema.properties
  if (props?.success && props?.data) {
    const data = props.data
    const isEmpty = typeof data === 'object' && !('$ref' in data) && Object.keys(data).length === 0
    return isEmpty ? undefined : data
  }
  return undefined
}

function unwrapEnvelopes(api: OpenAPIObject, schemas: Record<string, SchemaObject>): void {
  for (const item of Object.values(api.paths ?? {})) {
    if (!item || typeof item !== 'object') continue
    for (const method of HTTP_METHODS) {
      const op = (item as Record<string, unknown>)[method] as OperationObject | undefined
      if (!op || !op.responses) continue
      const responses = op.responses as ResponsesObject
      for (const [status, resp] of Object.entries(responses)) {
        if (!status.startsWith('2')) continue
        const r = resp as ResponseObject
        const mediaType = r.content?.['application/json']
          ? 'application/json'
          : r.content?.['*/*']
            ? '*/*'
            : undefined
        if (!mediaType) continue
        const media = r.content![mediaType]
        if (!media?.schema) continue
        const data = extractData(resolveSchema(media.schema as SchemaObject, schemas))
        if (data) media.schema = data
      }
    }
  }
}

// ── orphan prune: 어떤 $ref 도 안 닿는 컴포넌트 제거 (envelope wrapper 등) ──────
function pruneOrphans(api: OpenAPIObject, schemas: Record<string, SchemaObject>): void {
  const referenced = new Set<string>()
  const collect = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(collect)
      return
    }
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (typeof obj.$ref === 'string') {
      const m = obj.$ref.match(/^#\/components\/schemas\/(.+)$/)
      if (m) referenced.add(m[1])
    }
    for (const v of Object.values(obj)) collect(v)
  }
  collect(api.paths)
  // 참조된 것의 전이 참조도 유지
  let added = true
  while (added) {
    added = false
    for (const name of [...referenced]) {
      const s = schemas[name]
      if (!s) continue
      const before = referenced.size
      collect(s)
      if (referenced.size > before) added = true
    }
  }
  for (const name of Object.keys(schemas)) {
    if (!referenced.has(name)) delete schemas[name]
  }
}
