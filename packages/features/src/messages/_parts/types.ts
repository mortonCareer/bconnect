import type { MemberSummary, Message, DirectChat, GroupChat } from '@bconnect/api-client'

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

/** DM 목록 + 그룹 목록을 ChatSummary[] 로 병합 (최근 대화순). 순수 함수 — 앱 어댑터가 호출. */
export function toChatSummaries(
  directChats: DirectChat[] = [],
  groupChats: GroupChat[] = []
): ChatSummary[] {
  const dm = directChats.flatMap((c): ChatSummary[] =>
    c.id == null
      ? []
      : [
          {
            id: c.id,
            members: c.member ? [c.member] : [],
            lastMessage: c.lastMessage,
            unreadCount: c.unreadCount,
            modifiedAt: c.modifiedAt,
          },
        ]
  )
  const group = groupChats.flatMap((c): ChatSummary[] =>
    c.id == null
      ? []
      : [
          {
            id: c.id,
            members: c.participants ?? [],
            title: c.title,
            lastMessage: c.lastMessage,
            unreadCount: c.unreadCount,
            modifiedAt: c.modifiedAt,
          },
        ]
  )
  return [...dm, ...group].sort((a, b) => (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? ''))
}
