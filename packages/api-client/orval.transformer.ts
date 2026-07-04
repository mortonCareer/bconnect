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

// BE springdoc spec을 orval 입력용으로 정렬. 상세: packages/api-client/CLAUDE.md
const SCHEMA_KEEP_RESPONSE = new Set([
  'CheckUsernameResponse',
  'SendOtpResponse',
  'RefreshTokenResponse',
  'RegisterMemberResponse',
  'RegisterDeviceResponse',
  'VerifyOtpLoginResponse',
  'VerifyOtpSignupResponse',
])

const OPID_SPECIAL: Record<string, string> = {
  'GET /api/v1/members/check-username': 'checkUsername',
  'GET /api/v1/credentials/types': 'getCredentialTypes',
  'POST /api/v1/auth/otp/send': 'sendOtp',
  'POST /api/v1/auth/logout': 'logout',
  'GET /api/v1/credentials/me': 'getMyCredentials',
  'PUT /api/v1/offers/reorder': 'reorderOffers',
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'] as const

export default defineTransformer((spec) => {
  const api = spec as OpenAPIObject
  const schemas = (api.components?.schemas ?? {}) as Record<string, SchemaObject>

  if (api.info) api.info.title = 'Bconnect API'

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

function buildRenameMap(schemas: Record<string, SchemaObject>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const name of Object.keys(schemas)) {
    if (name.startsWith('ApiResponse')) continue
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
  for (const [from, to] of Object.entries(renameMap)) {
    if (from === to || !schemas[from]) continue
    schemas[to] = schemas[from]
    delete schemas[from]
  }
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

  const ACTIONS = ['accept', 'deny', 'show', 'hide', 'cancel']
  if (last && ACTIONS.includes(last)) return `${last}${singular}`

  if (rest.length >= 2 && isParam(rest[rest.length - 2]) && !isParam(last)) {
    return `${verb}${singular}${pascal(last)}`
  }

  const quals = rest.filter((s) => !isParam(s))
  const hasMe = quals.includes('me')
  const otherQuals = quals.filter((q) => q !== 'me')
  const hasItemParam = rest.some(isParam)

  const LIST_QUALS = ['sent', 'received']
  const listPrefix = otherQuals
    .filter((q) => LIST_QUALS.includes(q))
    .map(pascal)
    .join('')
  const subSuffix = otherQuals
    .filter((q) => !LIST_QUALS.includes(q))
    .map(pascal)
    .join('')

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
