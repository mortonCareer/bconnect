import { http } from 'msw'
import { ok, badRequest, unauthorized } from '../lib/response'
import { members, isoNow } from '../data/seed'

// dev 환경 임시 OTP 저장 — 동일 phone 으로 send → verify 가 즉시 작동하도록.
const verificationCodes = new Map<string, string>()

const generateToken = (userId: number) => `mock_token_${userId}_${Date.now()}`

export const authHandlers = [
  // OTP 발송 — 항상 성공, 코드는 항상 "123456" (dev 편의)
  http.post('*/api/v1/auth/otp/send', async ({ request }) => {
    const body = (await request.json()) as { phone?: string }
    if (!body.phone) return badRequest('유효하지 않은 입력값입니다', 'C001')
    verificationCodes.set(body.phone, '123456')
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW Auth] OTP sent to ${body.phone}: 123456`)
    }
    return ok({ expiresAt: new Date(Date.now() + 180000).toISOString() })
  }),

  // OTP 검증 + 로그인/회원가입 분기
  // - 01099로 시작 → 신규 (signupToken 발급)
  // - 그 외 → 기존 회원으로 로그인 (members[0])
  http.post('*/api/v1/auth/otp/verify', async ({ request }) => {
    const body = (await request.json()) as { phone?: string; code?: string }
    if (!body.phone || !body.code) {
      return badRequest('유효하지 않은 입력값입니다', 'C001')
    }
    const stored = verificationCodes.get(body.phone)
    if (stored !== body.code) {
      return badRequest('유효하지 않은 인증번호입니다', 'A003')
    }
    verificationCodes.delete(body.phone)

    if (body.phone.startsWith('01099')) {
      return ok({ registered: false, signupToken: `signup_${Date.now()}` })
    }

    const user = members.find((m) => m.phone === body.phone) ?? members[0]!
    const accessToken = generateToken(user.id)
    const refreshToken = `${generateToken(user.id)}_refresh`
    return ok(
      { registered: true, accessToken, refreshToken },
      {
        headers: {
          'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
        },
      }
    )
  }),

  // 토큰 갱신 — refreshToken 쿠키 있으면 새 accessToken 발급
  http.post('*/api/v1/auth/refresh', ({ request }) => {
    const cookie = request.headers.get('cookie') ?? ''
    if (!cookie.includes('refreshToken=')) {
      return unauthorized('유효하지 않은 리프레시 토큰입니다', 'A006')
    }
    return ok({ accessToken: generateToken(1) })
  }),

  // 로그아웃 — refreshToken 쿠키 만료
  http.post('*/api/v1/auth/logout', () =>
    ok(null, {
      headers: { 'Set-Cookie': 'refreshToken=; HttpOnly; Path=/; Max-Age=0' },
    })
  ),

  // 현재 사용자 (호환용 — openapi 에는 /members/me 가 표준이지만 mock-server 에서 지원하던 path)
  http.get('*/api/v1/auth/me', () => ok(members[0])),

  // members/me — orval 이 사용하는 표준 경로
  http.get('*/api/v1/members/me', () => ok({ ...members[0]!, modifiedAt: isoNow })),
]
