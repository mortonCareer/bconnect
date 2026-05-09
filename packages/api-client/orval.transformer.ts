import type {
  OpenAPIObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from 'openapi3-ts/oas31'
import { defineTransformer } from 'orval'

// Morton API 의 모든 성공 응답은 envelope 패턴 (`ApiSuccessResponseBase + allOf + data`).
// orval 이 그대로 generate 하면 hook 의 data 가 envelope (`{ success, data }`) 으로 노출 →
// 사용처에서 `result.data.data.foo` 같은 boilerplate 발생.
//
// 이 transformer 는 spec 자체에서 envelope 을 벗겨, generated type 이 inner data 만
// expose 하도록 변환. 런타임의 customFetch 가 envelope unwrap 한 결과와 type 정렬됨.
//
// 변환 패턴:
//   responses['2xx'].content['application/json'].schema:
//     allOf:
//       - $ref: '...ApiSuccessResponseBase'
//       - type: object
//         required: [data]
//         properties:
//           data: <inner schema>
//   ↓
//   responses['2xx'].content['application/json'].schema: <inner schema>
//
// 4xx/5xx 는 그대로 — customFetch 가 throw ApiError 로 처리, hook 사용처는 error 객체만 봄.
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

// allOf 두 항목 (ApiSuccessResponseBase + data 포함 object) 패턴이면 inner data schema 만 추출.
// 패턴이 안 맞으면 원본 그대로 (빈 응답, void 등).
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
