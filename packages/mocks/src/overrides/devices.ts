import { http, HttpResponse } from 'msw'
import { getRegisterDeviceMockHandler } from '@bconnect/api-client'
import type { DevicePlatform } from '@bconnect/api-client'

// FCM 디바이스 토큰 등록 — UPSERT 의미를 살리는 stateful override.
// 동일 토큰 재등록 시 last_active_at 갱신, 신규 토큰은 추가.
// (#233 BE 구현 후 prod 에선 실서버 호출, 본 mock 은 dev 전용)

interface DeviceRecord {
  id: number
  token: string
  platform: DevicePlatform
  createdAt: string
  lastActiveAt: string
}

const devices: DeviceRecord[] = []

export const devicesOverrides = [
  // 등록: UPSERT
  // orval 8 의 transformer 가 spec envelope 을 벗겨 generated mock handler 가
  // inner data 만 expect → 여기서도 inner data 만 return.
  getRegisterDeviceMockHandler(async ({ request }) => {
    const body = (await request.json()) as { token?: string; platform?: DevicePlatform }
    if (!body.token) return { registered: false }
    const now = new Date().toISOString()
    const existing = devices.find((d) => d.token === body.token)
    if (existing) {
      existing.lastActiveAt = now
      return { registered: true }
    }
    devices.push({
      id: devices.length + 1,
      token: body.token,
      platform: body.platform ?? 'web',
      createdAt: now,
      lastActiveAt: now,
    })
    return { registered: true }
  }),

  // 해제: orval 이 generate 한 unregister 는 void 라 mock 핸들러로는 stateful 처리 어려움.
  // raw http.delete 로 본문에서 token 추출해 실제 in-memory 에서 제거.
  http.delete('*/api/v1/devices', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { token?: string }
    if (body.token) {
      const idx = devices.findIndex((d) => d.token === body.token)
      if (idx !== -1) devices.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
