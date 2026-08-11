import { AttachmentType, ChatType, MessageType } from '@bconnect/api-client'
import type { Attachment, Message } from '@bconnect/api-client'
import { ws } from 'msw'
import { appendMockMessage, nextMockMessageId, MOCK_MY_ID } from './chats'
import { uploadedFile } from './_uploads'

/**
 * 채팅 STOMP 소켓 mock (#1150).
 *
 * MSW 는 HTTP 만 가로채서 mock 모드에서도 소켓만 실 BE 로 나갔고, 그 BE 는 mock 토큰을 거부해
 * 메시지 전송 자체가 불가능했다 — 사진이든 텍스트든 보낸 결과를 로컬에서 볼 수 없었다.
 * 여기서 STOMP 프레임을 흉내내 BE 의 @SendTo 브로드캐스트(본인 포함)까지 모사한다.
 *
 * 지원 프레임은 CONNECT / SUBSCRIBE / SEND / DISCONNECT 뿐이고, 하트비트는 CONNECTED 에서
 * `0,0` 으로 꺼서 주고받지 않는다.
 */

const NULL = '\u0000'

interface StompFrame {
  command: string
  headers: Record<string, string>
  body: string
}

const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(
  /^http/,
  'ws'
)

const chatSocket = ws.link(`${socketUrl}/ws`)

function parseFrames(data: string): StompFrame[] {
  return data
    .split(NULL)
    .map((chunk) => chunk.replace(/^\n+/, ''))
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const separator = chunk.indexOf('\n\n')
      const head = separator === -1 ? chunk : chunk.slice(0, separator)
      const body = separator === -1 ? '' : chunk.slice(separator + 2)
      const [command = '', ...headerLines] = head.split('\n')
      const headers: Record<string, string> = {}
      for (const line of headerLines) {
        const colon = line.indexOf(':')
        if (colon > 0) headers[line.slice(0, colon)] = line.slice(colon + 1)
      }
      return { command, headers, body }
    })
}

function serializeFrame(command: string, headers: Record<string, string>, body = ''): string {
  const head = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join('\n')
  return `${command}\n${head}\n\n${body}${NULL}`
}

interface SendBody {
  type: MessageType
  content?: string
  attachmentIds?: number[]
}

const attachmentOf = (id: number, index: number, stamp: string): Attachment => {
  const upload = uploadedFile(id)
  return {
    id,
    memberId: MOCK_MY_ID,
    type: AttachmentType.IMAGE,
    filename: `사진 ${index + 1}`,
    contentType: upload?.contentType ?? 'image/jpeg',
    size: upload?.size ?? 0,
    createdAt: stamp,
    modifiedAt: stamp,
    url: upload?.url ?? '',
  }
}

function buildMessage(chatId: number, body: SendBody): Message {
  const stamp = new Date().toISOString()
  return {
    id: nextMockMessageId(),
    chatId,
    chatType: ChatType.DIRECT,
    memberId: MOCK_MY_ID,
    type: body.type ?? MessageType.TEXT,
    content: body.content ?? '',
    createdAt: stamp,
    modifiedAt: stamp,
    attachments: (body.attachmentIds ?? []).map((id, index) => attachmentOf(id, index, stamp)),
  }
}

export const chatSocketOverrides = [
  chatSocket.addEventListener('connection', ({ client }) => {
    // subscription id → destination. BE 는 발신자를 포함해 구독자 전원에게 되돌려준다.
    const subscriptions = new Map<string, string>()

    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return

      for (const frame of parseFrames(event.data)) {
        if (frame.command === 'CONNECT' || frame.command === 'STOMP') {
          client.send(serializeFrame('CONNECTED', { version: '1.2', 'heart-beat': '0,0' }))
          continue
        }

        if (frame.command === 'SUBSCRIBE') {
          const id = frame.headers.id
          const destination = frame.headers.destination
          if (id && destination) subscriptions.set(id, destination)
          continue
        }

        if (frame.command === 'DISCONNECT') {
          const receipt = frame.headers.receipt
          if (receipt) client.send(serializeFrame('RECEIPT', { 'receipt-id': receipt }))
          continue
        }

        if (frame.command !== 'SEND') continue

        const chatId = Number(
          /\/app\/direct-chats\/(\d+)\/messages/.exec(frame.headers.destination ?? '')?.[1]
        )
        if (!Number.isFinite(chatId)) continue

        const message = buildMessage(chatId, JSON.parse(frame.body) as SendBody)
        appendMockMessage(chatId, message)

        const topic = `/topic/direct-chats/${chatId}`
        for (const [id, destination] of subscriptions) {
          if (destination !== topic) continue
          client.send(
            serializeFrame(
              'MESSAGE',
              {
                subscription: id,
                'message-id': `mock-${message.id}`,
                destination: topic,
                'content-type': 'application/json',
              },
              JSON.stringify(message)
            )
          )
        }
      }
    })
  }),
]
