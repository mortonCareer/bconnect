import { HttpResponse } from 'msw'

// Morton API 공통 응답 래퍼: { success, data, error }
// 실제 BE 가 항상 이 모양으로 응답하므로 mock 도 일치시킨다.
// (packages/api-client/src/openapi.yaml 의 ApiResponse 스키마)

export function ok<T>(data: T, init?: ResponseInit) {
  return HttpResponse.json({ success: true, data, error: null }, { status: 200, ...init })
}

export function created<T>(data: T) {
  return ok(data, { status: 201 })
}

export function noContent() {
  return new HttpResponse(null, { status: 204 })
}

export function badRequest(message = '잘못된 요청입니다', code = 'BAD_REQUEST') {
  return errorResponse(400, code, message)
}

export function unauthorized(message = '로그인이 필요합니다', code = 'UNAUTHORIZED') {
  return errorResponse(401, code, message)
}

export function forbidden(message = '접근 권한이 없습니다', code = 'FORBIDDEN') {
  return errorResponse(403, code, message)
}

export function notFound(message = '데이터를 찾을 수 없습니다', code = 'NOT_FOUND') {
  return errorResponse(404, code, message)
}

export function serverError(message = '서버 오류', code = 'INTERNAL_ERROR') {
  return errorResponse(500, code, message)
}

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      success: false,
      data: null,
      error: { code, status, message, logLevel: status >= 500 ? 'ERROR' : 'WARN' },
    },
    { status }
  )
}
