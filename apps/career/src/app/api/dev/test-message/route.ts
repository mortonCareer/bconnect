import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { env } from '@/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DevMessageBody {
  targetMemberId: number
  content: string
  senderPhone?: string
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: { code?: string; message?: string }
}

const OTP_CODE = '424242'
const DEFAULT_SENDER_PHONE = '01000000002'

const apiBase = () => env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')

async function callApi<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, init)
  const json = (await res.json()) as Envelope<T>
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(`${path} 실패 (${res.status}): ${JSON.stringify(json.error ?? json)}`)
  }
  return json.data
}

// 테스트 계정 토큰 획득 seam — dev BE DB의 otps 에 코드를 심은 뒤 verify 한다.
// BE OTP 저장소가 바뀌면(예: Redis 이관) 이 함수만 교체하면 나머지 흐름은 무관.
async function getTestAccountToken(phone: string): Promise<string> {
  const dbUrl = process.env.DEV_BE_DATABASE_URL
  if (!dbUrl) {
    throw new Error('DEV_BE_DATABASE_URL 미설정 — apps/career/.env.example 참조')
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10 })
  try {
    const seeded = await sql`
      update otps
      set code = ${OTP_CODE}, revoked = false, attempts = 0, daily_count = 0,
          expired_at = now() + interval '10 minutes'
      where phone = ${phone}
      returning id
    `
    if (seeded.length === 0) {
      throw new Error(
        `otps 에 ${phone} 이 없습니다 — 시드 계정을 쓰거나 해당 번호로 OTP 발송을 한 번 하세요`
      )
    }
  } finally {
    await sql.end()
  }

  const auth = await callApi<{ accessToken: string }>('/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code: OTP_CODE }),
  })
  return auth.accessToken
}

function stompFrame(command: string, headers: Record<string, string>, body = '') {
  const head = Object.entries(headers)
    .map(([k, v]) => `${k}:${v}`)
    .join('\n')
  return `${command}\n${head}\n\n${body}\0`
}

// 전송 확인은 본인 포함 브로드캐스트(@SendTo) 수신으로 판정 — useDirectChatSocket 과 동일 계약
async function fireStompMessage(token: string, chatId: number, content: string) {
  const wsUrl = apiBase().replace(/^http/, 'ws') + '/ws'
  const host = new URL(apiBase()).host
  const ws = new WebSocket(wsUrl)

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('STOMP 타임아웃 — 브로드캐스트 미수신')), 15000)
    function finish(error?: Error) {
      clearTimeout(timer)
      ws.close()
      if (error) reject(error)
      else resolve()
    }

    ws.addEventListener('open', () => {
      ws.send(
        stompFrame('CONNECT', {
          'accept-version': '1.2',
          host,
          Authorization: `Bearer ${token}`,
        })
      )
    })
    ws.addEventListener('message', (event) => {
      const text = String(event.data)
      if (text.startsWith('CONNECTED')) {
        ws.send(
          stompFrame('SUBSCRIBE', { id: 'dev-test', destination: `/topic/direct-chats/${chatId}` })
        )
        const body = JSON.stringify({ type: 'TEXT', content })
        ws.send(
          stompFrame(
            'SEND',
            {
              destination: `/app/direct-chats/${chatId}/messages`,
              'content-type': 'application/json',
              'content-length': String(Buffer.byteLength(body)),
            },
            body
          )
        )
      } else if (text.startsWith('MESSAGE')) {
        finish()
      } else if (text.startsWith('ERROR')) {
        finish(new Error(text.slice(0, 300)))
      }
    })
    ws.addEventListener('error', () => finish(new Error('WebSocket 연결 실패')))
  })
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  const { targetMemberId, content, senderPhone } = (await request.json()) as DevMessageBody
  if (!targetMemberId || !content) {
    return NextResponse.json({ error: 'targetMemberId 와 content 가 필요합니다' }, { status: 400 })
  }

  try {
    const phone = senderPhone || DEFAULT_SENDER_PHONE
    const token = await getTestAccountToken(phone)
    const chatId = await callApi<number>('/api/v1/direct-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ memberId: targetMemberId }),
    })
    await fireStompMessage(token, chatId, content)
    return NextResponse.json({ chatId, senderPhone: phone })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
