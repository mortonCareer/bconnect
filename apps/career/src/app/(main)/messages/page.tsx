'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useQueries,
  useGetMyChats,
  useGetMembers,
  getGetProfileQueryOptions,
} from '@morton/api-client'
import type { Member, Profile } from '@morton/api-client'
import { ChatListItem, TopBar } from '@morton/ui'
import { formatRelativeTime } from '@/lib/format-time'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { ROLE_LABELS } from '@/lib/role-labels'
import { useAuthStore } from '@/stores/auth-store'

export default function MessagesPage() {
  const router = useRouter()
  const currentUserId = useAuthStore((s) => s.member?.id)

  const { data: chats, isLoading } = useGetMyChats()

  const allChats = chats ?? []

  // 각 채팅의 상대방 멤버 ID 추출
  const otherMemberIds = useMemo(() => {
    const ids = new Set<number>()
    for (const chat of allChats) {
      const otherId = chat.participantIds?.find((id: number) => id !== currentUserId)
      if (otherId != null) ids.add(otherId)
    }
    return [...ids]
  }, [allChats, currentUserId])

  // 전체 Member 조회 후 매핑
  const { data: allMembers } = useGetMembers()

  const memberMap = useMemo(() => {
    const map = new Map<number, Member>()
    allMembers?.forEach((m: Member) => {
      if (m.id) map.set(m.id, m)
    })
    return map
  }, [allMembers])

  // 병렬 Profile 조회 (memberId를 profileId로 사용)
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

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="메시지" showAction={false} />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      ) : allChats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">채팅이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {allChats.map((chat) => {
            const otherId = chat.participantIds?.find((id: number) => id !== currentUserId)
            const otherMember = otherId != null ? memberMap.get(otherId) : undefined
            const otherProfile = otherId != null ? profileMap.get(otherId) : undefined

            return (
              <div
                key={chat.id}
                onClick={() => router.push(`/messages/${chat.id}`)}
                className="cursor-pointer"
              >
                <ChatListItem
                  variant="badge"
                  profileImage={otherMember?.picture}
                  name={otherMember?.name ?? chat.title ?? '채팅'}
                  location={otherProfile?.address?.city}
                  jobType={otherMember?.role ? ROLE_LABELS[otherMember.role] : undefined}
                  specialty={
                    otherProfile?.primaryTrade ? TRADE_LABELS[otherProfile.primaryTrade] : undefined
                  }
                  lastMessage={chat.lastMessage?.content}
                  timestamp={chat.modifiedAt ? formatRelativeTime(chat.modifiedAt) : undefined}
                  unreadCount={chat.unreadCount}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
