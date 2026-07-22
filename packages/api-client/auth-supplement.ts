import type { PathItemObject, SchemaObject } from 'openapi3-ts/oas31'

/**
 * 필터 기반 인증 엔드포인트 보충 (springdoc 구조적 불가시).
 *
 * `/auth/otp/verify`(OTP 로그인 필터)·`/auth/refresh`(RefreshTokenAuthenticationFilter)
 * 는 @RestController 메서드가 아니라 Spring Security 필터라 springdoc 이 영원히
 * 문서화 못 함 → BE-spec-as-SSOT 의 환원 불가능한 최소 수동면.
 *
 * becompat transformer 가 이 정의를 spec 에 병합 → orval 이 useVerifyOtp / 타입 /
 * mock 을 도메인 엔드포인트와 동일하게 생성. response 는 envelope 없이 inner data
 * 직접 기술 (런타임 unwrap 은 customFetch, 타입 정렬은 여기서 직접).
 */
export const authSupplementPaths: Record<string, PathItemObject> = {
  '/api/v1/auth/otp/verify': {
    post: {
      operationId: 'verifyOtp',
      tags: ['Auth'],
      summary: '인증코드 검증',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/VerifyCodeRequest' } },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/VerifyOtpLoginResponse' },
                  { $ref: '#/components/schemas/VerifyOtpSignupResponse' },
                ],
                discriminator: { propertyName: 'registered' },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/refresh': {
    post: {
      operationId: 'refreshToken',
      tags: ['Auth'],
      summary: '토큰 갱신',
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenResponse' } },
          },
        },
      },
    },
  },
}

export const authSupplementSchemas: Record<string, SchemaObject> = {
  VerifyCodeRequest: {
    type: 'object',
    required: ['phone', 'code'],
    properties: {
      phone: { type: 'string', pattern: '\\d{10,11}' },
      code: { type: 'string', pattern: '\\d{6}' },
    },
  },
  VerifyOtpLoginResponse: {
    type: 'object',
    required: ['registered', 'accessToken'],
    properties: {
      registered: { type: 'boolean', const: true },
      accessToken: { type: 'string' },
    },
  },
  VerifyOtpSignupResponse: {
    type: 'object',
    required: ['registered', 'signupToken'],
    properties: {
      registered: { type: 'boolean', const: false },
      signupToken: { type: 'string' },
    },
  },
  RefreshTokenResponse: {
    type: 'object',
    required: ['accessToken'],
    properties: {
      accessToken: { type: 'string' },
    },
  },
}
