import { http, HttpResponse } from 'msw'

// FCM 디바이스 토큰 등록/해제 — BE 미구현(#211, 전지원)이라 스펙에 /devices 없음 → orval 훅 부재.
// packages/push 가 raw fetch('/api/v1/devices') 로 호출하므로 raw MSW 핸들러로 가로챈다.
// UPSERT 의미를 살리는 stateful override(동일 토큰 재등록 시 last_active_at 갱신).
// #211 로 /devices 가 스펙에 들어오면 generated 핸들러로 교체하고 이 파일 삭제.

interface DeviceRecord {
  id: number
  token: string
  platform: string
  createdAt: string
  lastActiveAt: string
}

const devices: DeviceRecord[] = []

export const devicesOverrides = [
  // 등록: UPSERT
  http.post('*/api/v1/devices', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { token?: string; platform?: string }
    if (!body.token) return HttpResponse.json({ registered: false })
    const now = new Date().toISOString()
    const existing = devices.find((d) => d.token === body.token)
    if (existing) {
      existing.lastActiveAt = now
      return HttpResponse.json({ registered: true })
    }
    devices.push({
      id: devices.length + 1,
      token: body.token,
      platform: body.platform ?? 'web',
      createdAt: now,
      lastActiveAt: now,
    })
    return HttpResponse.json({ registered: true })
  }),

  // 해제: 본문에서 token 추출해 in-memory 에서 제거.
  http.delete('*/api/v1/devices', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { token?: string }
    if (body.token) {
      const idx = devices.findIndex((d) => d.token === body.token)
      if (idx !== -1) devices.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
