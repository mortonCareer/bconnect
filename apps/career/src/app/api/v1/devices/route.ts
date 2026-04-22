import { NextResponse } from 'next/server'

/**
 * Mock Route Handler — 디바이스 토큰 등록/삭제
 *
 * TODO(#???): BE(Spring Boot)에 POST/DELETE /api/v1/devices 구현되면 제거
 *   - BE 구현 시: apps/career/next.config.ts rewrites의 fallback이 자동으로
 *     api.bconnect.to/api/v1/devices로 프록시함 (Route Handler 제거만 하면 됨)
 *
 * 현재는 콘솔 로그만 찍어서 FCM 파이프라인(클라이언트 → Service Worker → 서버)
 * 동작 확인용
 */

interface RegisterPayload {
  token: string
  platform: 'web' | 'android' | 'ios'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload

    if (!body.token || !body.platform) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PAYLOAD', message: 'token, platform 필수' } },
        { status: 400 }
      )
    }

    // TODO: BE 구현 시 실제 DB 저장으로 교체
    console.log('[Mock] 디바이스 토큰 등록:', {
      platform: body.platform,
      tokenPreview: `${body.token.slice(0, 12)}...`,
    })

    return NextResponse.json({ success: true, data: { registered: true } })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { token: string }

    console.log('[Mock] 디바이스 토큰 삭제:', {
      tokenPreview: `${body.token.slice(0, 12)}...`,
    })

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }
}
