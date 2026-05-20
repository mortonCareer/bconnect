/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-5992
 */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  useQueries,
  useGetMyChats,
  useGetMyMember,
  getGetProfileQueryOptions,
} from '@bconnect/api-client'
import type { Profile } from '@bconnect/api-client'
import { ChatListItem, TopBar } from '@bconnect/ui'
import { formatRelativeTime } from '@/lib/format-time'
import { TRADE_LABELS } from '@/lib/trade-labels'

export default function MessagesPage() {
  const currentUserId = useGetMyMember().data?.id

  const { data: chats, isLoading } = useGetMyChats()

  const allChats = useMemo(() => chats ?? [], [chats])

  // Chat.participants 가 이미 MaskedMember[] — 상대방 member 정보 그대로 추출
  const otherMemberIds = useMemo(() => {
    const ids = new Set<number>()
    for (const chat of allChats) {
      const other = chat.participants?.find((p) => p.id !== currentUserId)
      if (other?.id != null) ids.add(other.id)
    }
    return [...ids]
  }, [allChats, currentUserId])

  // 병렬 Profile 조회 — chat 응답에 없는 풍부 정보(address, headline, primaryTrade 등) 보강
  const profileQueries = useQueries({
    queries: otherMemberIds.map((id) => ({
      ...getGetProfileQueryOptions(id),
      enabled: otherMemberIds.length > 0,
    })),
  })

  // useGetProfile 응답 = ProfileAndMember — 본 페이지는 profile 부분만 필요
  const profileMap = useMemo(() => {
    const map = new Map<number, Profile>()
    profileQueries.forEach((q, i) => {
      if (q.data) map.set(otherMemberIds[i], q.data.profile)
    })
    return map
  }, [profileQueries, otherMemberIds])

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="메시지" showAction={false} backHref="/" />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-bconnect-gray-500">로딩 중...</p>
        </div>
      ) : allChats.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-bconnect-gray-500">채팅이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {allChats.map((chat) => {
            const otherMember = chat.participants?.find((p) => p.id !== currentUserId)
            const otherId = otherMember?.id
            const otherProfile = otherId != null ? profileMap.get(otherId) : undefined

            return (
              <Link key={chat.id} href={`/messages/${chat.id}`} className="block px-4">
                <ChatListItem
                  variant="badge"
                  profileImage={otherMember?.picture ?? undefined}
                  name={otherMember?.name ?? chat.title ?? '채팅'}
                  location={otherProfile?.address?.city}
                  // TODO: role 은 MaskedMember 에 없음 (BE public masking) — 필요시 BE 협의
                  jobType={undefined}
                  specialty={
                    otherProfile?.primaryTrade ? TRADE_LABELS[otherProfile.primaryTrade] : undefined
                  }
                  lastMessage={chat.lastMessage?.content}
                  timestamp={chat.modifiedAt ? formatRelativeTime(chat.modifiedAt) : undefined}
                  unreadCount={chat.unreadCount}
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
