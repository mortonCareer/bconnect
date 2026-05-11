import type {
  OpenAPIObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from 'openapi3-ts/oas31'
import { defineTransformer } from 'orval'

/**
 * compile-time spec transformer — 2xx 응답의 envelope 패턴
 * (`allOf: [ApiSuccessResponseBase, {data: T}]`) 을 inner `T` 로 대체. 런타임의
 * `customFetch` envelope unwrap 과 type 정렬용. 4xx/5xx 는 그대로 (customFetch
 * 가 throw 처리). 자세한 결정 근거는 ADR-0005 참조.
 */
export default defineTransformer((spec) => {
  const openapi = spec as OpenAPIObject
  if (!openapi.paths) return openapi

  const transformedPaths: NonNullable<OpenAPIObject['paths']> = {}

  for (const [path, pathItem] of Object.entries(openapi.paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      transformedPaths[path] = pathItem
      continue
    }

    const transformedItem: Record<string, unknown> = { ...pathItem }

    for (const method of [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const) {
      const op = pathItem[method]
      if (!op || typeof op !== 'object' || !('responses' in op)) continue

      const responses = op.responses as ResponsesObject | undefined
      if (!responses) continue

      const transformedResponses: ResponsesObject = {}
      for (const [status, resp] of Object.entries(responses)) {
        // 2xx 만 unwrap, 그 외 (4xx 등) 는 그대로
        if (!status.startsWith('2')) {
          transformedResponses[status] = resp
          continue
        }
        transformedResponses[status] = unwrapEnvelope(resp as ResponseObject)
      }

      transformedItem[method] = { ...op, responses: transformedResponses }
    }

    transformedPaths[path] = transformedItem as (typeof openapi.paths)[string]
  }

  return { ...openapi, paths: transformedPaths }
})

/**
 * `allOf` 두 항목 (`ApiSuccessResponseBase` + `data` 포함 object) 패턴 발견 시
 * inner `data` schema 만 추출해 새 ResponseObject 반환. 패턴이 안 맞으면 원본
 * 그대로 (빈 응답, void 응답 등).
 */
function unwrapEnvelope(resp: ResponseObject): ResponseObject {
  const jsonContent = resp.content?.['application/json']
  if (!jsonContent?.schema) return resp

  const schema = jsonContent.schema as SchemaObject
  if (!Array.isArray(schema.allOf) || schema.allOf.length !== 2) return resp

  const dataWrapper = schema.allOf[1] as SchemaObject
  const dataSchema = dataWrapper.properties?.data
  if (!dataSchema) return resp

  return {
    ...resp,
    content: {
      ...resp.content,
      'application/json': { ...jsonContent, schema: dataSchema as SchemaObject },
    },
  }
}
