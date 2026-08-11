'use client'

import { useCallback, useState, type ReactNode } from 'react'
import {
  getGetDirectChatMessagesQueryKey,
  getGetDirectChatsQueryKey,
  getTradeLabel,
  MessageType,
  useQueryClient,
} from '@bconnect/api-client'
import type { CursorPageMessage, InfiniteData, Message, Profile } from '@bconnect/api-client'
import { ChatInput, ProfileCard, Skeleton } from '@bconnect/ui'
import { DEFAULT_PROFILE_IMAGE } from '@bconnect/config/avatar'
import { PanelShell } from '../_shared/PanelShell'
import { MessageThread } from './_parts/MessageThread'
import { chatMemberName } from './_parts/types'
import { useDirectChatSocket } from './useDirectChatSocket'
import type { OfferMessageDetail } from './_parts/OfferMessageCard'
import type { ChatSummary, OfferActions } from './_parts/types'

/** 앱이 resolve 해 내려주는 데이터. career/plan 어댑터가 useGetDirectChats·useGetProfile·useGetMyMember 로 채운다. */
export interface ChatViewData {
  chat?: ChatSummary
  /** 본인 member id — "나" 호출(useGetMyMember)은 앱에서 (ADR-0020: features 엔 "나" 호출 없음) */
  currentUserId?: number
  /** 상대 프로필 보강 — chat 응답에 없는 풍부 정보(address.city, primaryTrade). 발산 없는 by-id 보강 */
  otherProfile?: Profile
  /** 섭외 제안(OFFER) 메시지 상세 — key = offerId. 미주입이면 카드가 상세 없이 렌더 (plan) */
  offerDetails?: Map<number, OfferMessageDetail>
  /** 섭외 상세 조회 중 — 채팅 자체는 유지하고 OFFER 카드 안에서 상태 표시 */
  isOfferDetailsLoading?: boolean
  /** 섭외 상세 조회 실패 — 채팅 자체는 유지하고 OFFER 카드 안에서 상태 표시 */
  isOfferDetailsError?: boolean
  isLoading: boolean
  isError: boolean
}

/**
 * 사진 첨부 슬롯 — 앱이 useChatImageUpload 를 배선해 주입한다 (ADR-0020: features 는 mutation 을
 * 갖지 않는다). 미주입이면 갤러리 버튼이 비활성.
 */
export interface ChatImageActions {
  /** 고른 파일 업로드 → 첨부 id. 실패 시 자체 피드백 후 빈 배열 */
  upload: (files: File[]) => Promise<number[]>
  isUploading?: boolean
  /** 업로드 진행 상황 — 입력창이 "3/5" 로 노출 */
  progress?: { done: number; total: number } | null
  /** 업로드는 됐지만 소켓 전송이 실패했을 때 */
  onSendError?: () => void
}

type ChatViewBaseProps = {
  chatId: number
  data: ChatViewData
  /** 상대 프로필 패널/페이지 href 빌더 — 앱이 주입 (plan: panelHref, career: '/profile/'+id) */
  profileHref?: (memberId: number) => string
  /** 섭외 제안 수락/거절 — career(기술자)만 주입. 미주입이면 카드가 읽기전용 */
  offerActions?: OfferActions
  /** 사진 첨부 — 미주입이면 갤러리 버튼 비활성 */
  imageActions?: ChatImageActions
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
      /** 기본 패널 쉘 (plan) */
      renderShell?: never
      closeHref: string
      onClose: () => void
      backHref: string
    }

export type ChatViewProps = ChatViewBaseProps & ChatViewShellProps

export function ChatView(props: ChatViewProps) {
  const { chatId, data, profileHref, offerActions, imageActions } = props
  const {
    chat,
    currentUserId,
    otherProfile,
    offerDetails,
    isOfferDetailsLoading,
    isOfferDetailsError,
    isLoading,
    isError,
  } = data
  const other = chat?.members.find((p) => p.id !== currentUserId)
  const otherId = other?.id
  const title = chatMemberName(other) ?? chat?.title ?? '채팅'
  const profile = otherProfile

  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  // 수신(본인 발신 브로드캐스트 포함)이 단일 소스 — useDirectChatSocket 주석 참조
  const appendMessage = useCallback(
    (incoming: Message) => {
      setLocalMessages((prev) =>
        prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
      )
      queryClient.setQueryData<InfiniteData<CursorPageMessage>>(
        getGetDirectChatMessagesQueryKey(chatId),
        (prev) => {
          if (!prev) return prev
          const [newest, ...older] = prev.pages
          if (!newest) return prev
          if (prev.pages.some((page) => page.content?.some((m) => m.id === incoming.id)))
            return prev
          return {
            ...prev,
            pages: [{ ...newest, content: [incoming, ...(newest.content ?? [])] }, ...older],
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: getGetDirectChatsQueryKey() })
    },
    [chatId, queryClient]
  )
  const sendMessage = useDirectChatSocket(chatId, appendMessage)

  const handleSend = useCallback(() => {
    const content = message.trim()
    if (!content) return
    if (sendMessage({ type: MessageType.TEXT, content })) setMessage('')
  }, [message, sendMessage])

  // 선택 즉시 업로드 → 첨부 id 를 한 메시지로 전송. 업로드 실패는 imageActions 가 자체 안내한다.
  const handlePickImages = useCallback(
    async (files: File[]) => {
      if (!imageActions) return
      const attachmentIds = await imageActions.upload(files)
      if (attachmentIds.length === 0) return
      if (!sendMessage({ type: MessageType.IMAGE, attachmentIds })) imageActions.onSendError?.()
    },
    [imageActions, sendMessage]
  )

  const profilePanelHref = profileHref && otherId != null ? profileHref(otherId) : undefined
  const headerItem = (
    <ProfileCard
      className="px-4"
      avatarUrl={other?.picture || DEFAULT_PROFILE_IMAGE}
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
        offerDetails={offerDetails}
        isOfferDetailsLoading={isOfferDetailsLoading}
        isOfferDetailsError={isOfferDetailsError}
        offerActions={offerActions}
        // TODO(BE): 섭외/작업 응답에 업체명 필드가 없어 companyName 을 주입하지 못한다.
        // 채팅 상대 이름은 업체가 아니라 담당자 개인명이라 대체 불가 — 카드가 placeholder 로 렌더된다.
        // BE 에 필드가 추가되면 여기서 companyName 을 넘길 것.
      />
      <ChatInput
        value={message}
        onChange={setMessage}
        onSend={handleSend}
        onPickImages={imageActions ? (files) => void handlePickImages(files) : undefined}
        isUploading={imageActions?.isUploading}
        uploadProgress={imageActions?.progress}
      />
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
