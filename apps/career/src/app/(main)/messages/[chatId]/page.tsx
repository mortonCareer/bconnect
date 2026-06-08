/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6074
 * @figma-state 키보드열림 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=619-6031
 */
'use client'

import { useParams } from 'next/navigation'
import { CareerChatRoom } from '../_adapters/CareerMessagesView'

export default function ChatRoomPage() {
  const params = useParams<{ chatId: string }>()
  return <CareerChatRoom chatId={Number(params.chatId)} />
}
