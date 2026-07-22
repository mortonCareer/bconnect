import type { WithdrawableMember, Message, DirectChat, GroupChat } from '@bconnect/api-client'

/**
 * DM(DirectChat) + 그룹(GroupChat)을 하나로 정규화한 목록 항목.
 * 앱 어댑터가 useGetDirectChats + useGetGroupChats 를 이 모양으로 병합해 내려준다.
 * - DM: members = [상대 1명], title 없음
 * - 그룹: members = 참여자들, title 있음
 */
export interface ChatSummary {
  id: number
  members: WithdrawableMember[]
  title?: string
  lastMessage?: Message
  unreadCount?: number
  modifiedAt?: string
}

/**
 * DM 목록을 ChatSummary[] 로 정규화 (최근 대화순). 순수 함수 — 앱 어댑터가 호출.
 *
 * TODO(#759): 그룹 채팅은 아직 목록서 제외한다. direct_chat 과 group_chat 은 독립 id
 *   시퀀스라 raw id 로 병합하면 key 충돌(예: direct 200 ↔ group 200)이 나고, 채팅방
 *   라우팅(getDirectChatMessages vs getGroupChatMessages 분기)도 kind 없이는 모호하다.
 *   #759 에서 kind 디스크리미네이터 + 라우트 분기를 넣어 그룹을 정식 병합한다.
 */
export function toChatSummaries(
  directChats: DirectChat[] = [],
  _groupChats: GroupChat[] = []
): ChatSummary[] {
  return directChats
    .flatMap((c): ChatSummary[] =>
      c.id == null
        ? []
        : [
            {
              id: c.id,
              members: c.member ? [c.member] : [],
              lastMessage: c.lastMessage ?? undefined,
              unreadCount: c.unreadCount,
              modifiedAt: c.modifiedAt,
            },
          ]
    )
    .sort((a, b) => (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? ''))
}

/** 탈퇴 회원(name null)은 "탈퇴한 사용자"로 표시. member 자체가 없으면 undefined. */
export function chatMemberName(member: WithdrawableMember | null | undefined): string | undefined {
  if (!member) return undefined
  return member.name ?? '탈퇴한 사용자'
}
