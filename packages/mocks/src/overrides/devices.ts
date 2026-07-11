import { getCreateDeviceMockHandler, getDeleteDeviceMockHandler } from '@bconnect/api-client'
import type { RegisterDeviceRequest, UnregisterDeviceRequest } from '@bconnect/api-client'

// FCM 디바이스 토큰 UPSERT 의미를 살리는 stateful override(동일 토큰 재등록 시 last_active_at 갱신).

interface DeviceRecord {
  id: number
  token: string
  platform: string
  createdAt: string
  lastActiveAt: string
}

const devices: DeviceRecord[] = []

export const devicesOverrides = [
  getCreateDeviceMockHandler(async ({ request }) => {
    const body = (await request.json().catch(() => null)) as RegisterDeviceRequest | null
    if (!body?.token) return { registered: false }
    const now = new Date().toISOString()
    const existing = devices.find((d) => d.token === body.token)
    if (existing) {
      existing.lastActiveAt = now
      return { registered: true }
    }
    devices.push({
      id: devices.length + 1,
      token: body.token,
      platform: body.platform,
      createdAt: now,
      lastActiveAt: now,
    })
    return { registered: true }
  }),

  getDeleteDeviceMockHandler(async ({ request }) => {
    const body = (await request.json().catch(() => null)) as UnregisterDeviceRequest | null
    if (body?.token) {
      const idx = devices.findIndex((d) => d.token === body.token)
      if (idx !== -1) devices.splice(idx, 1)
    }
    return { success: true }
  }),
]
