'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { MessageType, getTradeLabel } from '@bconnect/api-client'
import type { Message, Profile } from '@bconnect/api-client'
import { ChatInput, ProfileCard, Skeleton } from '@bconnect/ui'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { PanelShell } from '../_shared/PanelShell'
import { MessageThread } from './_parts/MessageThread'
import type { ChatSummary } from './_parts/types'

/** 앱이 resolve 해 내려주는 데이터. career/plan 어댑터가 useGetDirectChats·useGetProfile·useGetMyMember 로 채운다. */
export interface ChatViewData {
  chat?: ChatSummary
  /** 본인 member id — "나" 호출(useGetMyMember)은 앱에서 (ADR-0020: features 엔 "나" 호출 없음) */
  currentUserId?: number
  /** 상대 프로필 보강 — chat 응답에 없는 풍부 정보(address.city, primaryTrade). 발산 없는 by-id 보강 */
  otherProfile?: Profile
  isLoading: boolean
  isError: boolean
}

type ChatViewBaseProps = {
  chatId: number
  data: ChatViewData
  /** 상대 프로필 패널/페이지 href 빌더 — 앱이 주입 (plan: panelHref, career: '/profile/'+id) */
  profileHref?: (memberId: number) => string
}

type ChatViewShellProps =
  | {
      /** 풀페이지 등 비-패널 쉘 주입 (career 풀페이지 라우트). title 은 비동기 도출분을 전달받음 */
      renderShell: (props: { title: string; children: ReactNode }) => ReactNode
      closeHref?: never
      onClose?: never
      backHref?: never
    }
  | {
      /** 기본 @panel 쉘 (plan) */
      renderShell?: never
      closeHref: string
      onClose: () => void
      backHref: string
    }

export type ChatViewProps = ChatViewBaseProps & ChatViewShellProps

export function ChatView(props: ChatViewProps) {
  const { chatId, data, profileHref } = props
  const { chat, currentUserId, otherProfile, isLoading, isError } = data
  const other = chat?.members.find((p) => p.id !== currentUserId)
  const otherId = other?.id
  const title = other?.name ?? chat?.title ?? '채팅'
  const profile = otherProfile

  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    if (currentUserId == null) return
    const content = message.trim()
    if (!content) return
    // 전송 엔드포인트 부재(BE 미구현) — optimistic-local echo. PR 본문 명시.
    const now = new Date().toISOString()
    const echo: Message = {
      id: Date.now(),
      chatId,
      memberId: currentUserId,
      type: MessageType.TEXT,
      content,
      createdAt: now,
      modifiedAt: now,
    }
    setLocalMessages((prev) => [...prev, echo])
    setMessage('')
  }, [chatId, currentUserId, message])

  const profilePanelHref = profileHref && otherId != null ? profileHref(otherId) : undefined
  const headerItem = (
    <ProfileCard
      className="px-4"
      avatarUrl={other?.picture || getAvatarUrl(title)}
      name={title}
      meta={{
        region: profile?.address?.city ?? '',
        trade: profile?.primaryTrade ? getTradeLabel(profile.primaryTrade) : '',
      }}
      description={profile?.about ?? profile?.headline ?? undefined}
      href={profilePanelHref}
    />
  )

  const body = isLoading ? (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="ml-auto h-12 w-1/2" />
      <Skeleton className="h-12 w-3/5" />
    </div>
  ) : isError || !chat ? (
    <div className="flex flex-1 items-center justify-center px-4 text-center">
      <p className="text-r-14 text-gray-500">대화를 불러올 수 없습니다</p>
    </div>
  ) : (
    <>
      <div className="shrink-0">{headerItem}</div>
      <MessageThread
        chatId={chatId}
        currentUserId={currentUserId}
        participants={chat.members}
        localMessages={localMessages}
      />
      <ChatInput value={message} onChange={setMessage} onSend={handleSend} />
    </>
  )

  if (props.renderShell) {
    return <>{props.renderShell({ title, children: body })}</>
  }

  return (
    <PanelShell
      title={title}
      backHref={props.backHref}
      backLabel="메시지 목록"
      closeLabel="메시지 패널 닫기"
      closeHref={props.closeHref}
      onClose={props.onClose}
    >
      {body}
    </PanelShell>
  )
}
