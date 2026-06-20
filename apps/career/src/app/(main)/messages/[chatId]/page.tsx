/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6074
 * @figma-state 키보드열림 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6031
 */
'use client'

import { useParams } from 'next/navigation'
import { CareerChatRoom } from '../_adapters/CareerMessagesView'
import { NotificationPrompt } from '@/components/notification-prompt'

export default function ChatRoomPage() {
  const params = useParams<{ chatId: string }>()
  return (
    <>
      <CareerChatRoom chatId={Number(params.chatId)} />
      {/* 알림 가치가 드러나는 컨텍스트(대화 진입)에서 soft-ask 노출 */}
      <NotificationPrompt />
    </>
  )
}
