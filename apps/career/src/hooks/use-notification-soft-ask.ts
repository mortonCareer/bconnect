'use client'

import { useEffect, useState } from 'react'
import { usePushStore } from '@/stores/push-store'
import { requestPushPermission } from '@/lib/request-push-permission'

const SUPPRESS_KEY = 'bconnect:notif-softask-suppressed-until'
const SESSION_KEY = 'bconnect:notif-softask-shown'
const SUPPRESS_DAYS = 7

function isSuppressed(): boolean {
  if (typeof window === 'undefined') return true
  return Date.now() < Number(localStorage.getItem(SUPPRESS_KEY) ?? 0)
}

function shownThisSession(): boolean {
  if (typeof window === 'undefined') return true
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

/**
 * 푸시 알림 soft-ask 게이트.
 *
 * 노출 조건: 지원 + 권한 미결정(prompt) + 7일 억제창 밖 + 세션 첫 노출.
 * 컨텍스트 트리거(채팅방 진입 등) 위치에서 마운트 → 마운트 시점이 곧 "언제".
 *
 * - accept: 네이티브 권한 요청(수락 시 토큰 동기화). denied 1회성이라 명시 수락 때만 호출
 * - dismiss: 7일 재노출 억제 — prompt 상태가 영구 미결정으로 남아 매 방문 nagging 되는 것 방지
 *   (스와이프/오버레이/ESC 닫기도 동일 처리)
 *
 * open 은 파생 상태다 — 노출/억제 게이트는 마운트 시점에 한 번 스냅샷(useState 초기화)해,
 * "세션 노출 표시"가 현재 시트를 즉시 닫아버리는 자기참조를 피한다.
 */
export function useNotificationSoftAsk() {
  const permissionStatus = usePushStore((s) => s.permissionStatus)
  const isSupported = usePushStore((s) => s.isSupported)
  const [decided, setDecided] = useState(false)

  // 마운트 시점 게이트 스냅샷 (억제창/세션노출). 이후 sessionStorage 갱신에 영향 안 받음.
  const [gate] = useState(() => !isSuppressed() && !shownThisSession())

  const open = isSupported && permissionStatus === 'prompt' && !decided && gate

  // 노출되면 이번 세션 노출 표시 (외부 시스템 갱신 — 재진입 시 재노출 억제)
  useEffect(() => {
    if (open) sessionStorage.setItem(SESSION_KEY, '1')
  }, [open])

  const accept = async () => {
    setDecided(true)
    await requestPushPermission()
  }

  const dismiss = () => {
    setDecided(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SUPPRESS_KEY, String(Date.now() + SUPPRESS_DAYS * 24 * 60 * 60 * 1000))
    }
  }

  return { open, accept, dismiss }
}
