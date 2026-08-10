'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { getAccessToken, refreshAccessToken } from '@bconnect/api-client'
import type { Message, MessageType } from '@bconnect/api-client'

/** BE SendMessageRequest 계약 — TEXT 는 content, IMAGE 는 attachmentIds 가 필수 */
export interface SendMessagePayload {
  type: MessageType
  content?: string
  attachmentIds?: number[]
}

const getWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  return base.replace(/^http/, 'ws') + '/ws'
}

/**
 * DM STOMP 소켓 — 채팅방 단위 연결/구독/전송.
 *
 * 전송 확인은 별도 ack 가 아니라 BE 의 @SendTo 브로드캐스트(본인 포함)로 돌아온다 —
 * 구독 수신이 곧 단일 소스라 낙관 echo 가 필요 없다.
 * CONNECT 헤더의 access token 은 재연결(beforeConnect)마다 갱신된다.
 */
export function useDirectChatSocket(chatId: number, onMessage: (message: Message) => void) {
  const clientRef = useRef<Client | null>(null)
  // 구독 콜백은 연결 시점에 한 번 등록됨 — ref 경유로 항상 최신 onMessage 를 부른다
  // (직접 참조하면 stale closure, deps 에 넣으면 리렌더마다 재연결)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    const client = new Client({
      brokerURL: getWsUrl(),
      reconnectDelay: 5000,
      beforeConnect: async () => {
        if (!getAccessToken()) await refreshAccessToken()
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken() ?? ''}` }
      },
      onConnect: () => {
        client.subscribe(`/topic/direct-chats/${chatId}`, (frame) => {
          onMessageRef.current(JSON.parse(frame.body) as Message)
        })
      },
    })
    client.activate()
    clientRef.current = client
    return () => {
      void client.deactivate()
      clientRef.current = null
    }
  }, [chatId])

  return useCallback(
    (payload: SendMessagePayload): boolean => {
      const client = clientRef.current
      if (!client?.connected) return false
      client.publish({
        destination: `/app/direct-chats/${chatId}/messages`,
        body: JSON.stringify(payload),
      })
      return true
    },
    [chatId]
  )
}
