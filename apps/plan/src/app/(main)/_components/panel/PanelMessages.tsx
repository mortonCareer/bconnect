'use client'

import { useMemo } from 'react'
import {
  useQueries,
  useGetDirectChats,
  useGetGroupChats,
  useGetMyMember,
  getGetProfileQueryOptions,
} from '@bconnect/api-client'
import type { Profile } from '@bconnect/api-client'
import {
  MessagesView,
  PanelAside,
  toChatSummaries,
  type MessagesViewData,
} from '@bconnect/features'
import { usePanelNav } from '@/hooks/usePanelNav'

export function PanelMessages() {
  const { panelHref, closeHref, close } = usePanelNav()
  const { data: me, isLoading: isMeLoading } = useGetMyMember()
  const currentUserId = me?.id
  // 내 채팅 = DM + 그룹 병합 (통합 목록 엔드포인트 부재 → FE 병합, #759)
  const dm = useGetDirectChats()
  const group = useGetGroupChats()
  const allChats = useMemo(() => toChatSummaries(dm.data, group.data), [dm.data, group.data])

  // 상대방 member id 모음 — members 에서 본인 제외
  const otherMemberIds = useMemo(() => {
    const ids = new Set<number>()
    for (const chat of allChats) {
      const other = chat.members.find((p) => p.id !== currentUserId)
      if (other?.id != null) ids.add(other.id)
    }
    return [...ids]
  }, [allChats, currentUserId])

  // 병렬 Profile 조회 — chat 응답에 없는 풍부 정보(address, primaryTrade) 보강
  const profileQueries = useQueries({
    queries: otherMemberIds.map((id) => ({
      ...getGetProfileQueryOptions(id),
      enabled: otherMemberIds.length > 0,
    })),
  })

  const profileMap = useMemo(() => {
    const map = new Map<number, Profile>()
    profileQueries.forEach((q, i) => {
      if (q.data) map.set(otherMemberIds[i], q.data)
    })
    return map
  }, [profileQueries, otherMemberIds])

  const data: MessagesViewData = {
    chats: allChats,
    currentUserId,
    profileMap,
    isLoading: isMeLoading || dm.isLoading || group.isLoading,
    isError: dm.isError || group.isError,
  }

  return (
    <PanelAside label="메시지 목록">
      <MessagesView
        data={data}
        chatHref={(chatId) => panelHref(`messages/${chatId}`)}
        closeHref={closeHref}
        onClose={close}
      />
    </PanelAside>
  )
}
