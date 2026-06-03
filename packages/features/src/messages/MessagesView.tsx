'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  useQueries,
  useGetMyChats,
  useGetMyMember,
  getGetProfileQueryOptions,
  TRADE_LABELS,
} from '@bconnect/api-client'
import type { Profile } from '@bconnect/api-client'
import { ChatListItem, Skeleton } from '@bconnect/ui'
import { formatRelativeTime } from '@bconnect/config/format'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'

export interface MessagesViewProps {
  closeHref: string
  onClose: () => void
  /** 대화방 패널 href 빌더 — 앱이 주입 (plan: panelHref('/messages/'+id), career: '/messages/'+id) */
  chatHref: (chatId: number) => string
}

export function MessagesView({ closeHref, onClose, chatHref }: MessagesViewProps) {
  const { data: me, isLoading: isMeLoading } = useGetMyMember()
  const currentUserId = me?.id
  const { data: chats, isLoading: isChatsLoading, isError } = useGetMyChats()
  const isLoading = isMeLoading || isChatsLoading
  const allChats = useMemo(() => chats ?? [], [chats])

  // 상대방 member id 모음 — Chat.participants(MaskedMember[]) 에서 본인 제외
  const otherMemberIds = useMemo(() => {
    const ids = new Set<number>()
    for (const chat of allChats) {
      const other = chat.participants.find((p) => p.id !== currentUserId)
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
      if (q.data) map.set(otherMemberIds[i], q.data.profile)
    })
    return map
  }, [profileQueries, otherMemberIds])

  return (
    <PanelShell
      title="메시지"
      closeLabel="메시지 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
    >
      <PanelScroll>
        {isLoading ? (
          <MessagesSkeleton />
        ) : isError ? (
          <PanelMessage>메시지를 불러올 수 없습니다</PanelMessage>
        ) : allChats.length === 0 ? (
          <PanelMessage>진행 중인 대화가 없습니다</PanelMessage>
        ) : (
          <div className="flex flex-col">
            {allChats.map((chat) => {
              const otherMember = chat.participants.find((p) => p.id !== currentUserId)
              const otherId = otherMember?.id
              const otherProfile = otherId != null ? profileMap.get(otherId) : undefined
              return (
                <Link key={chat.id} href={chatHref(chat.id)} scroll={false} className="block px-4">
                  <ChatListItem
                    variant="badge"
                    profileImage={otherMember?.picture ?? undefined}
                    name={otherMember?.name ?? chat.title ?? '채팅'}
                    location={otherProfile?.address?.city}
                    specialty={
                      otherProfile?.primaryTrade
                        ? TRADE_LABELS[otherProfile.primaryTrade]
                        : undefined
                    }
                    lastMessage={chat.lastMessage.content}
                    timestamp={formatRelativeTime(chat.modifiedAt)}
                    unreadCount={chat.unreadCount}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </PanelScroll>
    </PanelShell>
  )
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}
