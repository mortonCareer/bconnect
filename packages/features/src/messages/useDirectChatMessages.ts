'use client'

import { useMemo } from 'react'
import {
  MessageType,
  useInfiniteQuery,
  getDirectChatMessages,
  getGetDirectChatMessagesQueryKey,
} from '@bconnect/api-client'
import type { CursorPageMessage, InfiniteData } from '@bconnect/api-client'

/**
 * 채팅방 메시지 무한 조회. MessageThread 와 앱 어댑터(career·plan)가 이 훅으로 같은 캐시를 공유한다.
 * 옵션을 호출부마다 두면 queryKey·페이지네이션이 갈라져 섭외 카드가 간헐적으로 비므로 여기서만 정의한다.
 *
 * TODO(#759): 지금은 direct(1:1) 메시지 고정. 그룹 지원 시 chatKind 로 direct/group 분기.
 */
export function useDirectChatMessages(chatId: number) {
  return useInfiniteQuery<
    CursorPageMessage,
    Error,
    InfiniteData<CursorPageMessage>,
    readonly unknown[],
    number | undefined
  >({
    queryKey: getGetDirectChatMessagesQueryKey(chatId),
    queryFn: ({ pageParam }) => getDirectChatMessages(chatId, { cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  })
}

/**
 * 채팅방에 실린 OFFER 메시지의 offerId 모음. OFFER 메시지의 content 는 화면에 노출하지 않고
 * offerId 숫자 문자열로만 쓴다 — 앱이 이 id 로 섭외 상세를 resolve 해 ChatView 에 내려준다(ADR-0020).
 */
export function useChatOfferIds(chatId: number): number[] {
  const { data } = useDirectChatMessages(chatId)
  return useMemo(() => {
    const ids = new Set<number>()
    for (const page of data?.pages ?? [])
      for (const message of page.content ?? []) {
        if (message.type !== MessageType.OFFER) continue
        const offerId = Number(message.content)
        if (Number.isFinite(offerId)) ids.add(offerId)
      }
    return [...ids]
  }, [data])
}
