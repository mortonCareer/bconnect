'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { TRADE_LABELS } from '@bconnect/api-client'
import type { Chat, Profile } from '@bconnect/api-client'
import { ChatListItem, Skeleton } from '@bconnect/ui'
import { formatRelativeTime } from '@bconnect/config/format'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'

/** 앱이 resolve 해 내려주는 데이터. 어댑터가 useGetMyChats·useGetMyMember + 병렬 Profile 보강으로 채운다. */
export interface MessagesViewData {
  chats?: Chat[]
  /** 본인 member id — "나" 호출(useGetMyMember)은 앱에서 (ADR-0020: features 엔 "나" 호출 없음) */
  currentUserId?: number
  /** 상대 member id → Profile 보강 맵 — chat 응답에 없는 address.city/primaryTrade 등 */
  profileMap?: Map<number, Profile>
  isLoading: boolean
  isError: boolean
}

interface MessagesViewBaseProps {
  data: MessagesViewData
  /** 대화방 href 빌더 — 앱이 주입 (plan: panelHref('/messages/'+id), career: '/messages/'+id) */
  chatHref: (chatId: number) => string
}

type MessagesViewShellProps =
  | {
      /** 풀페이지 등 비-패널 쉘 주입 (career 풀페이지 라우트) */
      renderShell: (props: { title: string; children: ReactNode }) => ReactNode
      closeHref?: never
      onClose?: never
    }
  | {
      /** 기본 @panel 쉘 (plan) */
      renderShell?: never
      closeHref: string
      onClose: () => void
    }

export type MessagesViewProps = MessagesViewBaseProps & MessagesViewShellProps

export function MessagesView(props: MessagesViewProps) {
  const { data, chatHref } = props
  const { currentUserId, profileMap, isLoading, isError } = data
  const allChats = data.chats ?? []

  const body = (
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
            const otherProfile = otherId != null ? profileMap?.get(otherId) : undefined
            const trade = otherProfile?.primaryTrade
              ? TRADE_LABELS[otherProfile.primaryTrade]
              : undefined
            // TODO(#473): 등급=member role 을 BE 가 미제공 — mock 표시
            const grade = '준기공(Mocked)'
            return (
              <Link key={chat.id} href={chatHref(chat.id)} scroll={false} className="block px-4">
                <ChatListItem
                  variant="badge"
                  profileImage={otherMember?.picture ?? undefined}
                  name={otherMember?.name ?? chat.title ?? '채팅'}
                  jobType={trade}
                  specialty={grade}
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
  )

  if (props.renderShell) {
    return <>{props.renderShell({ title: '메시지', children: body })}</>
  }

  return (
    <PanelShell
      title="메시지"
      closeLabel="메시지 패널 닫기"
      closeHref={props.closeHref}
      onClose={props.onClose}
    >
      {body}
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
