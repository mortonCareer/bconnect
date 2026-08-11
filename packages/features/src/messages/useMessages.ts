'use client'

import { useGetDirectChats, useGetGroupChats, useAuthHint } from '@bconnect/api-client'
import { toChatSummaries } from './_parts/types'

/**
 * 진입점 뱃지용 미읽음 채팅 총합 (DM + 그룹).
 * 통합 목록 엔드포인트 부재로 두 목록을 합산 (#759).
 * 공개 페이지에도 마운트되는 인증 필요 조회 — 로그아웃 상태면 정지(#802, 힌트 쿠키 판정).
 * TODO: unreadCount 가 optional emit 이라 누락 시 0 으로 fallback — BE required 처리 후 정확.
 */
export function useUnreadChatCount(): number {
  const enabled = useAuthHint()
  const dm = useGetDirectChats({ query: { enabled } })
  const group = useGetGroupChats({ query: { enabled } })
  return toChatSummaries(dm.data, group.data).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
}
