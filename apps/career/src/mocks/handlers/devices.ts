import { http, HttpResponse } from 'msw'
import { ok } from '../lib/response'

// FCM 디바이스 토큰 등록/해제 — BE 구현(#233) 전 임시.
// PR #226 의 Next.js Route Handler `/api/v1/devices/route.ts` 를 대체.
// BE 가 실제 endpoint 를 구현하면 이 핸들러는 자동으로 우회됨 (production 미적용).

interface DeviceRecord {
  id: number
  memberId: number
  token: string
  platform: 'WEB' | 'ANDROID' | 'IOS'
  createdAt: string
  lastActiveAt: string
}

const devices: DeviceRecord[] = []

export const devicesHandlers = [
  // 디바이스 토큰 등록 (UPSERT — 동일 토큰 재등록 시 last_active_at 갱신)
  http.post('*/api/v1/devices', async ({ request }) => {
    const body = (await request.json()) as { token?: string; platform?: DeviceRecord['platform'] }
    if (!body.token) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'C001',
            status: 400,
            message: 'token 이 필요합니다',
            logLevel: 'WARN',
          },
        },
        { status: 400 }
      )
    }
    const now = new Date().toISOString()
    const existing = devices.find((d) => d.token === body.token)
    if (existing) {
      existing.lastActiveAt = now
      return ok({ id: existing.id, registered: true })
    }
    const newDevice: DeviceRecord = {
      id: devices.length + 1,
      memberId: 1,
      token: body.token,
      platform: body.platform ?? 'WEB',
      createdAt: now,
      lastActiveAt: now,
    }
    devices.push(newDevice)
    return ok({ id: newDevice.id, registered: true })
  }),

  // 디바이스 토큰 해제 (로그아웃, 권한 거부 시)
  http.delete('*/api/v1/devices', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { token?: string }
    if (body.token) {
      const idx = devices.findIndex((d) => d.token === body.token)
      if (idx !== -1) devices.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
