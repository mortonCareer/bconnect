'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useQueries,
  useGetDirectChats,
  useGetGroupChats,
  useGetMyMember,
  useGetProfile,
  getGetProfileQueryOptions,
} from '@bconnect/api-client'
import type { Profile } from '@bconnect/api-client'
import {
  MessagesView,
  ChatView,
  toChatSummaries,
  type MessagesViewData,
  type ChatViewData,
} from '@bconnect/features'
import { careerShell } from '@/app/(main)/_adapters/careerShell'

/** 메시지 목록 (/messages) — My 훅 + 병렬 Profile 보강을 resolve 해 MessagesView 로 내려준다. */
export function CareerMessagesList() {
  const router = useRouter()
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
    <MessagesView
      data={data}
      chatHref={(chatId) => `/messages/${chatId}`}
      renderShell={careerShell(() => router.push('/'))}
    />
  )
}

/** 채팅방 (/messages/[chatId]) — chat·상대 Profile·본인 id 를 resolve 해 ChatView 로 내려준다. */
export function CareerChatRoom({ chatId }: { chatId: number }) {
  const router = useRouter()
  const currentUserId = useGetMyMember().data?.id
  // TODO(#760): 단건 조회 엔드포인트 부재 → DM 목록에서 filter. 그룹 단건은 #759.
  const { data: directChats, isLoading, isError } = useGetDirectChats()
  const chat = useMemo(
    () => toChatSummaries(directChats).find((c) => c.id === chatId),
    [directChats, chatId]
  )
  const otherId = chat?.members.find((p) => p.id !== currentUserId)?.id
  const { data: otherProfile } = useGetProfile(otherId ?? 0, {
    query: { enabled: otherId != null },
  })

  const data: ChatViewData = {
    chat,
    currentUserId,
    otherProfile,
    isLoading,
    isError,
  }

  return (
    <ChatView
      chatId={chatId}
      data={data}
      profileHref={(id) => `/profile/${id}`}
      renderShell={careerShell(() => router.back(), { fill: true })}
    />
  )
}
