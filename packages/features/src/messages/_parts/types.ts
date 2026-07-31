import { MessageType } from '@bconnect/api-client'
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

/**
 * 목록의 마지막 메시지 미리보기 텍스트.
 * OFFER 는 content 가 offerId 라 그대로 노출하면 숫자가 보인다 → 타입별 라벨로 대체.
 */
export function chatPreviewText(message: Message | undefined): string | undefined {
  if (!message) return undefined
  switch (message.type) {
    case MessageType.OFFER:
      return '섭외 제안'
    case MessageType.IMAGE:
      return '사진'
    case MessageType.FILE:
      return '파일'
    default:
      return message.content
  }
}

export type OfferActionKind = 'accept' | 'deny'

/**
 * 채팅방 섭외 제안(OFFER) 메시지의 수락/거절 슬롯. 앱이 mutation 을 배선해 주입한다
 * (career 만 주입, plan 은 미주입 → 읽기전용). ADR-0020: features 는 mutation 을 갖지 않는다.
 */
export interface OfferActions {
  onAccept: (offerId: number) => void
  onDeny: (offerId: number) => void
  /** 처리 중인 offerId — 해당 카드 버튼 비활성 (중복 클릭 방지) */
  pendingOfferId?: number | null
  /** 처리 중인 액션 — 버튼별 loading 표시용 */
  pendingAction?: OfferActionKind | null
}

/** 탈퇴 회원(name null)은 "탈퇴한 사용자"로 표시. member 자체가 없으면 undefined. */
export function chatMemberName(member: WithdrawableMember | null | undefined): string | undefined {
  if (!member) return undefined
  return member.name ?? '탈퇴한 사용자'
}
