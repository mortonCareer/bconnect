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
 * 레이어. 4단계로 springdoc 의 Java 파생 모양을 FE 가 기대하는 캐논 모양으로 정렬:
 *   1. enum hoisting — inline enum → named 컴포넌트 ($ref). Trade/Role/CredentialType/MessageType.
 *   2. schema rename — `*Response` strip (엔티티) + 예외맵. 그 외(Request/op-response) 유지.
 *   3. operationId rewrite — springdoc 의 쓰레기 opId(get_4 등) 무시, (method+path) 규칙 + 예외맵.
 *   4. envelope unwrap — flat `{success,error,data}` 에서 data 만. 그 후 orphan 컴포넌트 prune.
 *
 * 규칙 기반(2·3)이라 새 CRUD 엔드포인트는 자동 커버. 도메인 동사·shape 차이만 예외맵.
 */

// ── 1. enum hoist: 값집합 sentinel → 캐논 이름 ──────────────────────────────
const ENUM_HOISTS: Array<{ name: string; has: string[] }> = [
  { name: 'Trade', has: ['DESIGN', 'TILING', 'WALLPAPER'] },
  { name: 'Role', has: ['GUEST', 'FOREMAN', 'ADMIN'] },
  { name: 'CredentialType', has: ['IDENTITY_VERIFICATION', 'CAREER_CERTIFICATE'] },
  { name: 'MessageType', has: ['TEXT', 'IMAGE', 'FILE'] },
]

// ── 2. schema rename 예외 (Response-strip 규칙으로 안 풀리는 것) ──────────────
const SCHEMA_RENAME: Record<string, string> = {
  CursorPageMessageResponse: 'MessageCursorPage',
}
// Response 를 strip 하지 않고 그대로 둘 op-response DTO
const SCHEMA_KEEP_RESPONSE = new Set([
  'CheckUsernameResponse',
  'SendOtpResponse',
  'RefreshTokenResponse',
  'RegisterMemberResponse',
  'RegisterDeviceResponse',
  'VerifyOtpLoginResponse',
  'VerifyOtpSignupResponse',
])

// ── 3. operationId 예외 (도메인 동사 — 규칙으로 안 풀림) ──────────────────────
const OPID_EXCEPTIONS: Record<string, string> = {
  'DELETE /api/v1/members/me': 'withdraw',
  'POST /api/v1/members': 'registerMember',
  'POST /api/v1/devices': 'registerDevice',
  'DELETE /api/v1/devices': 'unregisterDevice',
  'DELETE /api/v1/coworker-requests/{id}': 'cancelCoworkerRequest',
  'GET /api/v1/tasks': 'getMyTasks',
  'GET /api/v1/chats': 'getMyChats',
  'GET /api/v1/chats/{chatId}/messages': 'getChatMessages',
  'POST /api/v1/chats/direct': 'createDirectChat',
  'POST /api/v1/auth/otp/send': 'sendOtp',
  'POST /api/v1/auth/otp/verify': 'verifyOtp',
  'POST /api/v1/auth/logout': 'logout',
  'POST /api/v1/auth/refresh': 'refreshToken',
  'PATCH /api/v1/profiles/me/about': 'updateMyProfileAbout',
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

  // enum 은 BE 가 ModelResolver.enumsAsRef=true 로 이미 named $ref 로 emit →
  // hoistEnums 는 fresh spec 에선 no-op (inline enum 없음). 방어적으로 유지.
  hoistEnums(schemas)
  const renameMap = buildRenameMap(schemas)
  applyRename(api, schemas, renameMap)
  rewriteOperationIds(api)
  unwrapEnvelopes(api, schemas)
  pruneOrphans(api, schemas)

  return api
})

// ── 1. enum hoisting ────────────────────────────────────────────────────────
function hoistEnums(schemas: Record<string, SchemaObject>): void {
  const ensure = (name: string, values: string[]) => {
    if (!schemas[name]) schemas[name] = { type: 'string', enum: values }
  }
  const matchName = (values: string[]): string | undefined =>
    ENUM_HOISTS.find((h) => h.has.every((v) => values.includes(v)))?.name

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      const child = obj[key] as Record<string, unknown> | undefined
      if (
        child &&
        typeof child === 'object' &&
        child.type === 'string' &&
        Array.isArray(child.enum)
      ) {
        const name = matchName(child.enum as string[])
        if (name) {
          ensure(name, child.enum as string[])
          obj[key] = { $ref: `#/components/schemas/${name}` }
          continue
        }
      }
      visit(obj[key])
    }
  }
  // 컴포넌트 본문만 순회 (방금 만든 named enum 자신은 건드리지 않게 스냅샷)
  for (const name of Object.keys(schemas)) {
    if (ENUM_HOISTS.some((h) => h.name === name)) continue
    visit(schemas[name])
  }
}

// ── 2. schema rename ────────────────────────────────────────────────────────
function buildRenameMap(schemas: Record<string, SchemaObject>): Record<string, string> {
  const map: Record<string, string> = { ...SCHEMA_RENAME }
  for (const name of Object.keys(schemas)) {
    if (map[name]) continue
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
const SINGULARIZE: Record<string, string> = {
  feeds: 'Feed',
  members: 'Member',
  profiles: 'Profile',
  posts: 'Post',
  tasks: 'Task',
  chats: 'Chat',
  credentials: 'Credential',
  coworkers: 'Coworker',
  recommendations: 'Recommendation',
  'coworker-requests': 'CoworkerRequest',
  messages: 'Message',
}
const PLURALIZE: Record<string, string> = {
  feeds: 'Feeds',
  members: 'Members',
  profiles: 'Profiles',
  posts: 'Posts',
  tasks: 'Tasks',
  chats: 'Chats',
  credentials: 'Credentials',
  coworkers: 'Coworkers',
  recommendations: 'Recommendations',
  'coworker-requests': 'CoworkerRequests',
  messages: 'Messages',
}

function pascal(seg: string): string {
  return seg
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

function deriveOperationId(method: string, path: string): string {
  const key = `${method.toUpperCase()} ${path}`
  if (OPID_EXCEPTIONS[key]) return OPID_EXCEPTIONS[key]

  const segs = path.replace(/^\/api\/v1\//, '').split('/')
  const resource = segs[0]
  const rest = segs.slice(1)
  const isParam = (s: string) => s.startsWith('{')
  const last = rest[rest.length - 1]

  // 말단 액션 세그먼트 (accept/deny/show/hide 등) → verb + 단수
  const ACTIONS = ['accept', 'deny', 'show', 'hide']
  if (last && ACTIONS.includes(last)) return `${last}${SINGULARIZE[resource] ?? pascal(resource)}`

  // 한정자 (me / sent / received) 수집
  const quals = rest.filter((s) => !isParam(s))
  const hasMe = quals.includes('me')
  const otherQuals = quals.filter((q) => q !== 'me')
  const hasItemParam = rest.some(isParam)

  const verb =
    method === 'get'
      ? 'get'
      : method === 'post'
        ? 'create'
        : method === 'put' || method === 'patch'
          ? 'update'
          : 'delete'

  // 특수 단일 한정자 라우트: check-username 등
  if (resource === 'members' && otherQuals.includes('check-username')) return 'checkUsername'
  if (resource === 'credentials' && otherQuals.includes('types')) return 'getCredentialTypes'

  const qualPrefix = otherQuals.map(pascal).join('')

  // 복수/단수 결정:
  //   - item 파라미터 있음 → 단수 (getFeed)
  //   - me 단독(목록 한정자 없음) → 단수 (getMyMember/getMyProfile)
  //   - 그 외 GET → 복수 (getFeeds, getSentRecommendations, getMySentRecommendations)
  //   - 비-GET → 단수 (createPost)
  const LIST_QUALS = ['sent', 'received']
  const listQual = otherQuals.some((q) => LIST_QUALS.includes(q))
  const plural = method === 'get' && !hasItemParam && !(hasMe && !listQual)
  const noun = plural
    ? (PLURALIZE[resource] ?? pascal(resource) + 's')
    : (SINGULARIZE[resource] ?? pascal(resource))

  const myPart = hasMe ? 'My' : ''
  return `${verb}${myPart}${qualPrefix}${noun}`
}

function rewriteOperationIds(api: OpenAPIObject): void {
  for (const [path, item] of Object.entries(api.paths ?? {})) {
    if (!item || typeof item !== 'object') continue
    for (const method of HTTP_METHODS) {
      const op = (item as Record<string, unknown>)[method] as OperationObject | undefined
      if (!op || typeof op !== 'object') continue
      op.operationId = deriveOperationId(method, path)
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
