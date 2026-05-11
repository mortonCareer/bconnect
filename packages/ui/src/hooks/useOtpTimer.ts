'use client'

import { useEffect, useState } from 'react'

function calculateRemainingSeconds(expiresAt: string | null): number {
  if (!expiresAt) return 0
  const target = new Date(expiresAt).getTime()
  if (Number.isNaN(target)) return 0
  return Math.max(0, Math.floor((target - Date.now()) / 1000))
}

function formatRemainingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export interface UseOtpTimerResult {
  remainingSeconds: number
  formatted: string
  expired: boolean
}

/**
 * OTP 만료 시각 (ISO string) 을 받아 초 단위 카운트다운을 1초 간격으로 갱신.
 * `expiresAt` 변경 시 자동 리셋 — `key` prop trick 불필요.
 *
 * - `remainingSeconds`: 남은 초 (만료 시 0)
 * - `formatted`: `m:ss` 형식 (`0:42`)
 * - `expired`: `remainingSeconds === 0`
 */
export function useOtpTimer(expiresAt: string | null): UseOtpTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculateRemainingSeconds(expiresAt)
  )

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(expiresAt))
  }, [expiresAt])

  useEffect(() => {
    if (remainingSeconds <= 0) return
    const id = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [remainingSeconds])

  return {
    remainingSeconds,
    formatted: formatRemainingTime(remainingSeconds),
    expired: remainingSeconds <= 0,
  }
}
