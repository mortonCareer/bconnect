import type { MemberSummary, Message } from '@bconnect/api-client'

/**
 * DM(DirectChat) + 그룹(GroupChat)을 하나로 정규화한 목록 항목.
 * 앱 어댑터가 useGetDirectChats + useGetGroupChats 를 이 모양으로 병합해 내려준다.
 * - DM: members = [상대 1명], title 없음
 * - 그룹: members = 참여자들, title 있음
 */
export interface ChatSummary {
  id: number
  members: MemberSummary[]
  title?: string
  lastMessage?: Message
  unreadCount?: number
  modifiedAt?: string
}
