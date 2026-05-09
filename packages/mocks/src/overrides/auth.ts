import { http, HttpResponse } from 'msw'
import {
  getSendOtpMockHandler,
  getRefreshTokenMockHandler,
  getLogoutMockHandler,
} from '@bconnect/api-client'

// dev 편의용 고정값 — docs/how-to/qa-and-testing.md "테스트 데이터 생성" 섹션과 일치.
const MOCK_OTP_CODE = '123456'
const NEW_USER_PHONE_PREFIX = '01099'

// 동일 phone 으로 send → verify 가 즉시 작동하도록 in-memory 저장.
const verificationCodes = new Map<string, string>()

const generateToken = (label: string) => `mock_${label}_${Date.now()}`

// orval 자동 생성 mock 의 stateful override — 시그니처는 generated 가 강제.
//
// Why: faker 응답으로는 OTP 흐름(보낸 코드 ↔ 검증 코드 매칭, 신규/기존 회원 분기,
// refresh token 발급) 같은 상태 의존 시나리오를 표현할 수 없음. 자동 생성을 base 로
// 두고 stateful endpoint 만 override.
export const authOverrides = [
  // OTP 발송: 코드 저장 + 만료시각 응답.
  // orval 8 의 transformer 가 spec envelope 을 벗겨 generated mock handler 가
  // inner data 만 expect → 여기서도 inner data 만 return (envelope wrapping 은
  // generated mock 이 자동 처리).
  getSendOtpMockHandler(async ({ request }) => {
    const body = (await request.json()) as { phone?: string }
    if (body.phone) {
      verificationCodes.set(body.phone, MOCK_OTP_CODE)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MSW Auth] OTP sent to ${body.phone}: ${MOCK_OTP_CODE}`)
      }
    }
    return { expiresAt: new Date(Date.now() + 180000).toISOString() }
  }),

  // OTP 검증: orval mock 은 200 만 생성하므로 error 응답이 필요한 이 endpoint 는 raw 핸들러.
  // - 신규 (01099 prefix): VerifyOtpSignupResponse
  // - 기존: VerifyOtpLoginResponse + Set-Cookie (refreshToken)
  // - 잘못된 코드: 401 Morton API 공통 에러 포맷
  http.post('*/api/v1/auth/otp/verify', async ({ request }) => {
    const body = (await request.json()) as { phone?: string; code?: string }
    if (!body.phone || !body.code) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'C001',
            status: 400,
            message: '유효하지 않은 입력값입니다',
            logLevel: 'WARN',
          },
        },
        { status: 400 }
      )
    }
    if (verificationCodes.get(body.phone) !== body.code) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'A003',
            status: 401,
            message: '유효하지 않은 인증번호입니다',
            logLevel: 'WARN',
          },
        },
        { status: 401 }
      )
    }
    verificationCodes.delete(body.phone)

    if (body.phone.startsWith(NEW_USER_PHONE_PREFIX)) {
      return HttpResponse.json({
        success: true,
        data: { registered: false, signupToken: generateToken('signup') },
      })
    }
    const accessToken = generateToken('access')
    const refreshToken = generateToken('refresh')
    return HttpResponse.json(
      {
        success: true,
        data: { registered: true, accessToken, refreshToken },
      },
      {
        headers: {
          'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
        },
      }
    )
  }),

  // refresh: 매번 새 access token 발급. mock 에선 쿠키 검증을 생략 (실제 BE 는 검증).
  getRefreshTokenMockHandler(() => ({
    accessToken: generateToken('access'),
    refreshToken: generateToken('refresh'),
  })),

  // logout: void 응답 (orval 기본 시그니처 그대로).
  getLogoutMockHandler(),
]
