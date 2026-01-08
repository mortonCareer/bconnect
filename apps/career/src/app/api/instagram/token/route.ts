import { NextRequest, NextResponse } from 'next/server'

const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token'
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: '코드가 필요합니다' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: '환경 변수가 설정되지 않았습니다' }, { status: 500 })
    }

    // 1. 단기 토큰 교환
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    })

    const tokenResponse = await fetch(INSTAGRAM_TOKEN_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData)
      return NextResponse.json(
        { error: tokenData.error_message || '토큰 교환 실패' },
        { status: 400 }
      )
    }

    // 2. 장기 토큰으로 교환
    const longTokenParams = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: clientSecret,
      access_token: tokenData.access_token,
    })

    const longTokenResponse = await fetch(
      `${INSTAGRAM_GRAPH_URL}/access_token?${longTokenParams.toString()}`
    )

    const longTokenData = await longTokenResponse.json()

    if (!longTokenResponse.ok) {
      console.error('Long-lived token error:', longTokenData)
      // 단기 토큰이라도 반환
      return NextResponse.json({
        access_token: tokenData.access_token,
        user_id: tokenData.user_id,
        token_type: 'short_lived',
      })
    }

    return NextResponse.json({
      access_token: longTokenData.access_token,
      user_id: tokenData.user_id,
      token_type: 'long_lived',
      expires_in: longTokenData.expires_in,
    })
  } catch (error) {
    console.error('Instagram token error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
